import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/postgres';

type DbUser = {
  id: string;
  email: string;
  username: string | null;
  provider: string;
  personal_info: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at?: string;
};

const OPPOSE_GENDER_RATIO = 0.6;
const TOTAL_LIMIT = 10;
const AGE_RANGE = 5;

function getOppositeGender(gender: string): string | null {
  const g = gender.trim().toLowerCase();
  if (g === 'male') return 'female';
  if (g === 'female') return 'male';
  return null; // For non-binary, we can default to 'random' or handle separately
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- The Trojan Horse Logic ---

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Extract Requester Data
    const requesterGender = typeof user.personal_info?.gender === 'string' 
      ? user.personal_info.gender 
      : 'unknown';
      
    const requesterBirthday = typeof user.personal_info?.birthday === 'string' 
      ? user.personal_info.birthday 
      : null;

    // 2. Calculate Age Range (Default: +/- 5 years)
    let lowAge = 18; // Safety floor
    let highAge = 99;
    
    if (requesterBirthday) {
      const birthYear = new Date(requesterBirthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      // For Launch: Widen this if you only have 10 users! 
      // Maybe use +/- 10 years for the first month?
      lowAge = Math.max(18, age - AGE_RANGE); 
      highAge = age + AGE_RANGE;
    }

    // 3. Define the "Secret Mix" (The Trojan Horse)
    // We want roughly 60% Opposite Gender (Romance Potential) + 40% Same Gender (Friend Potential)
    const oppositeGender = getOppositeGender(requesterGender);
    
    // If gender is unknown or non-binary, we just do pure random
    if (!oppositeGender || requesterGender === 'unknown') {
      const randomUsers = await query<DbUser>(
        `SELECT id, username, personal_info FROM users WHERE id <> $1 ORDER BY random() LIMIT $2`,
        [user.id, TOTAL_LIMIT]
      );
      return NextResponse.json({ users: randomUsers });
    }

    // Determine target counts (Biased Randomness)
    // This creates natural variation so it doesn't feel like a rigid algorithm
    let targetOpposite = 0;
    for (let i = 0; i < TOTAL_LIMIT; i++) {
      if (Math.random() < OPPOSE_GENDER_RATIO) targetOpposite++; 
    }
    const targetSame = TOTAL_LIMIT - targetOpposite;

    // 4. Parallel Execution (Faster Response Time)
    // We run both queries at once instead of waiting for one to finish
    const [oppositeResults, sameResults] = await Promise.all([
      // Fetch Opposite Gender Candidates
      query<DbUser>(
        `
        SELECT id, username, personal_info 
        FROM users
        WHERE id <> $1
          AND (personal_info->>'birthday') ~ '^\\d{4}-\\d{2}-\\d{2}$'
          AND date_part('year', age(current_date, (personal_info->>'birthday')::date))::int BETWEEN $2 AND $3
          AND lower(personal_info->>'gender') = lower($4)
        ORDER BY random()
        LIMIT $5
        `,
        [user.id, lowAge, highAge, oppositeGender, targetOpposite]
      ),
      // Fetch Same Gender Candidates
      query<DbUser>(
        `
        SELECT id, username, personal_info 
        FROM users
        WHERE id <> $1
          AND (personal_info->>'birthday') ~ '^\\d{4}-\\d{2}-\\d{2}$'
          AND date_part('year', age(current_date, (personal_info->>'birthday')::date))::int BETWEEN $2 AND $3
          AND lower(personal_info->>'gender') = lower($4)
        ORDER BY random()
        LIMIT $5
        `,
        [user.id, lowAge, highAge, requesterGender, targetSame]
      )
    ]);

    // 5. Merge & Deduplicate
    const combined = [...oppositeResults, ...sameResults];
    const seenIds = new Set(combined.map(u => u.id));

    // 6. The "Desperation Fill" (Crucial for MVP/Launch)
    // If we didn't find 10 people (because the filters were too strict), 
    // fill the remaining slots with ANYONE active, ignoring Age/Gender preference.
    if (combined.length < TOTAL_LIMIT) {
      const missingCount = TOTAL_LIMIT - combined.length;
      const excludeIds = [user.id, ...Array.from(seenIds)];
      
      const fillers = await query<DbUser>(
        `
        SELECT id, username, personal_info 
        FROM users
        WHERE id <> ALL($1::uuid[])
        ORDER BY random()
        LIMIT $2
        `,
        [excludeIds, missingCount]
      );
      
      combined.push(...fillers);
    }

    // 7. Final Shuffle (The Illusion)
    const finalFeed = shuffleInPlace(combined);

    return NextResponse.json({ users: finalFeed });

  } catch (error) {
    console.error('Feed generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}