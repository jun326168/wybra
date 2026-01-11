import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/postgres';
import { User } from '@/lib/type';

// --- Config ---
const OPPOSE_GENDER_RATIO = 0.7;
const TOTAL_LIMIT = 10;
const AGE_RANGE = 5;

// --- Helpers ---

function getOppositeGender(gender: string): string | null {
  const g = gender?.trim().toLowerCase() || '';
  if (g === 'male') return 'female';
  if (g === 'female') return 'male';
  return null;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// --- Main Handler ---

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getTodayString();
    
    // Get all user IDs that the current user already has chats with
    const existingChats = await query<{ other_user_id: string }>(
      `
      SELECT 
        CASE 
          WHEN user_1 = $1 THEN user_2
          ELSE user_1
        END as other_user_id
      FROM chats
      WHERE user_1 = $1 OR user_2 = $1
      `,
      [user.id]
    );
    
    const existingChatUserIds = new Set(existingChats.map(c => c.other_user_id));
    
    // ---------------------------------------------------------
    // 1. CHECK CACHE: Do we already have a feed for today?
    // ---------------------------------------------------------
    const storedFeed = await query<{ user_ids: string[] }>(
      `SELECT user_ids FROM daily_feeds WHERE user_id = $1 AND feed_date = $2`,
      [user.id, today]
    );
    
    if (storedFeed.length > 0 && Array.isArray(storedFeed[0].user_ids) && storedFeed[0].user_ids.length > 0) {
      // HIT: Fetch the exact profiles stored in the feed (from today, so return as-is even if they now have chats)
      const feedIds = storedFeed[0].user_ids;
      
      const cachedUsers = await query<User>(
        `SELECT id, username, personal_info FROM users WHERE id = ANY($1::uuid[])`,
        [feedIds]
      );

      // Restore the original shuffled order (SQL doesn't guarantee order by IN array)
      const orderedUsers = feedIds
        .map((id: string) => cachedUsers.find(u => u.id === id))
        .filter((u): u is User => u !== undefined) // Filter out any users that might have been deleted
        .map((u) => ({
          ...u,
          has_chat: existingChatUserIds.has(u.id),
        }));

      return NextResponse.json({ users: orderedUsers });
    }

    // ---------------------------------------------------------
    // 2. CACHE MISS: Generate New Trojan Horse Feed
    // ---------------------------------------------------------
    
    const requesterGender = typeof user.personal_info?.gender === 'string' 
      ? user.personal_info.gender 
      : 'unknown';
      
    const requesterBirthday = typeof user.personal_info?.birthday === 'string' 
      ? user.personal_info.birthday 
      : null;

    // Calculate Age Range
    let lowAge = 18;
    let highAge = 99;
    
    if (requesterBirthday) {
      const birthYear = new Date(requesterBirthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      lowAge = Math.max(18, age - AGE_RANGE); 
      highAge = age + AGE_RANGE;
    }

    const oppositeGender = getOppositeGender(requesterGender);
    let combined: User[] = [];

    // Build exclusion list: current user + users already in chats
    const excludeIds = [user.id, ...Array.from(existingChatUserIds)];
    
    // --- Generation Logic (Same as your design) ---
    if (!oppositeGender || requesterGender === 'unknown') {
      // Pure Random for NB or Unknown
      combined = await query<User>(
        `SELECT id, username, personal_info FROM users WHERE id <> ALL($1::uuid[]) ORDER BY random() LIMIT $2`,
        [excludeIds, TOTAL_LIMIT]
      );
    } else {
      // Biased Mix
      let targetOpposite = 0;
      for (let i = 0; i < TOTAL_LIMIT; i++) {
        if (Math.random() < OPPOSE_GENDER_RATIO) targetOpposite++; 
      }
      const targetSame = TOTAL_LIMIT - targetOpposite;

      const [oppositeResults, sameResults] = await Promise.all([
        query<User>(
          `
          SELECT id, username, personal_info 
          FROM users
          WHERE id <> ALL($1::uuid[])
            AND (personal_info->>'birthday') ~ '^\\d{4}-\\d{2}-\\d{2}$'
            AND date_part('year', age(current_date, (personal_info->>'birthday')::date))::int BETWEEN $2 AND $3
            AND lower(personal_info->>'gender') = lower($4)
          ORDER BY random()
          LIMIT $5
          `,
          [excludeIds, lowAge, highAge, oppositeGender, targetOpposite]
        ),
        query<User>(
          `
          SELECT id, username, personal_info 
          FROM users
          WHERE id <> ALL($1::uuid[])
            AND (personal_info->>'birthday') ~ '^\\d{4}-\\d{2}-\\d{2}$'
            AND date_part('year', age(current_date, (personal_info->>'birthday')::date))::int BETWEEN $2 AND $3
            AND lower(personal_info->>'gender') = lower($4)
          ORDER BY random()
          LIMIT $5
          `,
          [excludeIds, lowAge, highAge, requesterGender, targetSame]
        )
      ]);

      combined = [...oppositeResults, ...sameResults];
    }

    // Filter out any users that now have chats (in case they were added between query and now)
    combined = combined.filter(u => !existingChatUserIds.has(u.id));

    // Desperation Fill - keep trying until we have 10 users, excluding those with chats
    const seenIds = new Set(combined.map(u => u.id));
    if (combined.length < TOTAL_LIMIT) {
      const missingCount = TOTAL_LIMIT - combined.length;
      const finalExcludeIds = [...excludeIds, ...Array.from(seenIds)];
      
      const fillers = await query<User>(
        `
        SELECT id, username, personal_info 
        FROM users
        WHERE id <> ALL($1::uuid[])
        ORDER BY random()
        LIMIT $2
        `,
        [finalExcludeIds, missingCount]
      );
      combined.push(...fillers);
    }

    // Final Shuffle
    const finalFeed = shuffleInPlace(combined);

    // ---------------------------------------------------------
    // 3. SAVE TO DB: Save feed to daily_feeds table
    // ---------------------------------------------------------
    
    const feedUserIds = finalFeed.map(u => u.id);

    // Delete old feeds for this user (all feeds except today's)
    await query(
      `DELETE FROM daily_feeds WHERE user_id = $1 AND feed_date <> $2`,
      [user.id, today]
    );

    // Insert or update today's feed
    await query(
      `
      INSERT INTO daily_feeds (user_id, feed_date, user_ids)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (user_id, feed_date)
      DO UPDATE SET user_ids = $3::jsonb, created_at = now()
      `,
      [user.id, today, JSON.stringify(feedUserIds)]
    );

    // Add has_chat flag to each user (should be false for newly generated feed, but check anyway)
    const usersWithChatFlag = finalFeed.map((u) => ({
      ...u,
      has_chat: existingChatUserIds.has(u.id),
    }));

    return NextResponse.json({ users: usersWithChatFlag });

  } catch (error) {
    console.error('Feed generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}