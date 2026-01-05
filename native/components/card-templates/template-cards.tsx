import React from 'react'
import { View, Text, StyleSheet, Platform, Image } from 'react-native'
import { colors, darkenHexColor } from '@/lib/colors'
import { INTEREST_TAGS, MBTI_OPTIONS, PHOTO_BLUR_AMOUNT } from '@/lib/setup'
import LogoIcon from '@/svgs/logo'

export type TemplateCardProps = {
  user: any
  themeColor: string
}

export const TEMPLATE_OPTIONS = [
  {
    id: 'classic',
    label: 'Journal',
  },
  {
    id: 'quote',
    label: 'Quote',
  },
  {
    id: 'zine',
    label: 'Zine',
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
  },
  {
    id: 'ticket',
    label: 'Ticket',
  },
];

export const ClassicCard = ({ user, themeColor }: TemplateCardProps) => {

  const mbtiTag = user.personal_info.mbti === 'UNKNOWN' ? '' : '#' + MBTI_OPTIONS.find(option => option.value === user.personal_info.mbti)?.value + ' ';
  let isDefault = themeColor === colors.background;

  if (isDefault) {
    themeColor = colors.text;
  }

  return (
    <View style={[styles.templateCard, styles.classicCard, { shadowColor: themeColor }]}> 
      {/* Left line */}
      <View style={[styles.classicLeftLine, { backgroundColor: themeColor + '88' }]} />

      {/* Content */}
      <View style={styles.classicContentContainer}>
        <View style={styles.classicContentHeader}>
          {/* avatar */}
          <View style={[styles.classicContentAvatarContainer, { borderColor: themeColor }]}>
            <Image source={{ uri: user.personal_info.avatar_url }} style={styles.classicContentAvatar} blurRadius={PHOTO_BLUR_AMOUNT} />
            <View style={styles.classicContentAvatarOverlay}>
              <LogoIcon size={28} floatingY={0} stroke={isDefault ? colors.background : themeColor} />
            </View>
          </View>
          {/* gen */}
          {/* <View style={[styles.classicContentGenerationContainer]}>
            <Text style={[styles.classicContentGenerationText, { color: themeColor }]}>{GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text>
          </View> */}
        </View>
        <View style={styles.classicContentHeading}>
          <Text style={[styles.classicContentHeadingText, { color: themeColor }]}>{user.username}</Text>
        </View>
        <View style={styles.classicContentBody}>
          <Text style={styles.classicContentBodyText} numberOfLines={6}>{user.personal_info.bio}</Text>
        </View>
        <View style={styles.classicContentBody}>
          <Text style={styles.classicContentBodyText}>MY CITY：</Text>
          <Text style={styles.classicContentBodyText} numberOfLines={2}>{'我最喜歡...\n'}{user.personal_info.custom_question.love}</Text>
          <Text style={styles.classicContentBodyText} numberOfLines={2}>{'我最討厭...\n'}{user.personal_info.custom_question.hate}</Text>
        </View>
        <View style={styles.classicContentBody}>
          <Text style={styles.classicContentBodyText} numberOfLines={2}>{mbtiTag}{user.personal_info.interests.map((i: string) => i.startsWith('#') ? i : INTEREST_TAGS.find(tag => tag.id === i)?.label).join(' ')}</Text>
        </View>
      </View>
    </View>
  );
};

export const QuoteCard = ({ user, themeColor }: TemplateCardProps) => {
  const mbtiTag = user.personal_info.mbti === 'UNKNOWN' ? '' : '#' + MBTI_OPTIONS.find(option => option.value === user.personal_info.mbti)?.value + ' ';
  let isDefault = themeColor === colors.background;

  if (isDefault) {
    themeColor = colors.text;
  }

  const darkenedColor = darkenHexColor(themeColor, 0.2);

  return (
    <View style={[styles.templateCard, styles.quoteCard, { backgroundColor: darkenedColor + '24' }]}> 
      {/* background quote symbol */}
      <View style={[styles.quoteBackgroundSymbol, { left: 0, top: 0 }]}>
        <Text style={styles.quoteBackgroundSymbolText}>“</Text>
      </View>
      <View style={[styles.quoteBackgroundSymbol, { right: 0, bottom: 0 }]}>
        <Text style={styles.quoteBackgroundSymbolText}>”</Text>
      </View>
      {/* tags */}
      <View style={styles.quoteTagsContainer}>
        <Text style={styles.quoteTagText}>-</Text>
        <Text style={[styles.quoteTagText, { maxWidth: '70%' }]}>{mbtiTag}{user.personal_info.interests.map((i: string) => i.startsWith('#') ? i : INTEREST_TAGS.find(tag => tag.id === i)?.label).join(' ')}</Text>
        <Text style={styles.quoteTagText}>-</Text>
      </View>
      {/* quote */}
      <View style={styles.quoteContentContainer}>
        {/* bio */}
        <Text style={styles.quoteContentText} numberOfLines={10}>{user.personal_info.bio}</Text>
        {/* city */}
        <View style={styles.quoteContentAuthorRow}>
          <View style={styles.quoteContentAuthorAvatarContainer}>
            <Image source={{ uri: user.personal_info.avatar_url }} style={[styles.quoteContentAuthorAvatar, { borderColor: themeColor }]} blurRadius={PHOTO_BLUR_AMOUNT} />
            <View style={styles.quoteContentAuthorAvatarOverlay}>
              <LogoIcon size={20} floatingY={0} stroke={isDefault ? colors.background : themeColor} />
            </View>
          </View>
          <Text style={styles.quoteContentAuthorName}>{user.username}</Text>
        </View>
      </View>
      {/* footer */}
      {/* <View style={styles.quoteTagsContainer}>
        <Text style={styles.quoteTagText}>-</Text>
        <Text style={[styles.quoteTagText, { fontSize: 12 }]}>{GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text>
        <Text style={styles.quoteTagText}>-</Text>
      </View> */}
    </View>
  );
};

export const ZineCard = ({ user, themeColor }: TemplateCardProps) => {
  const mbtiTag = user.personal_info.mbti === 'UNKNOWN' ? '' : '#' + MBTI_OPTIONS.find(option => option.value === user.personal_info.mbti)?.value + ' ';
  let isDefault = themeColor === colors.background;

  if (isDefault) {
    themeColor = colors.text;
  }

  // Random angles for sticker effect (-2 to +2 degrees)
  const stickerAngles = [2, -2.2, 1.8, -3.8, 2.3, -1.9, 2.7, -1.4, 2.6];

  return (
    <View style={[styles.templateCard, styles.zineCard, { backgroundColor: colors.card }]}> 

      {/* Avatar - Top Right */}
      <View style={styles.zineAvatarContainer}>
        <View style={[styles.zineAvatarWrapper, { borderColor: themeColor, transform: [{ rotate: `${stickerAngles[0]}deg` }] }]}>
          <Image source={{ uri: user.personal_info.avatar_url }} style={styles.zineAvatar} blurRadius={PHOTO_BLUR_AMOUNT} />
          <View style={styles.zineAvatarOverlay}>
            <LogoIcon size={36} floatingY={0} stroke={isDefault ? colors.background : themeColor} />
          </View>
        </View>
      </View>

      {/* Bio - Upper Left */}
      <View style={styles.zineBioContainer}>
        <View style={[styles.zineSticker, { backgroundColor: themeColor + '28', transform: [{ rotate: `${stickerAngles[1]}deg` }] }]}>
          <Text style={styles.zineBioText} numberOfLines={7}>{user.personal_info.bio}</Text>
        </View>
      </View>

      {/* Interest Tags - Middle Bottom Left */}
      <View style={styles.zineInterestsContainerWrapper}>
        <View style={styles.zineInterestsContainer}>
          {[mbtiTag, ...user.personal_info.interests.slice(0, 4)].filter(Boolean).map((interest: string, index: number) => {
            const label = interest.startsWith('#') ? interest : INTEREST_TAGS.find(tag => tag.id === interest)?.label || interest;
            return (
              <View
                key={index}
                style={[
                  styles.zineInterestTag,
                  {
                    backgroundColor: themeColor + '48',
                    transform: [{ rotate: `${stickerAngles[(index + 2) % stickerAngles.length]}deg` }]
                  }
                ]}
              >
                <Text style={styles.zineInterestText}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* City Question - Middle Bottom Right */}
      <View style={styles.zineCityContainer}>
        <View style={[styles.zineSticker, { backgroundColor: themeColor + '32', transform: [{ rotate: `${stickerAngles[7]}deg` }] }]}>
          <Text style={styles.zineCityLabel}>About My City</Text>
          <Text style={styles.zineCityText} numberOfLines={3}>
            💚 {user.personal_info.custom_question.love}
          </Text>
          <Text style={styles.zineCityText} numberOfLines={3}>
            💔 {user.personal_info.custom_question.hate}
          </Text>
        </View>
      </View>

      {/* Username - Bottom Left (No Sticker) */}
      <View style={styles.zineUsernameContainer}>
        <Text style={[styles.zineUsername, { color: themeColor }]}>{user.username}</Text>
      </View>

      {/* Generation - Bottom Right (Sticker) */}
      {/* <View style={styles.zineGenerationContainer}>
        <View style={[styles.zineGenerationSticker, { backgroundColor: themeColor + '24', transform: [{ rotate: `${stickerAngles[8]}deg` }] }]}>
          <Text style={styles.zineGenerationText}>我是 {GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text>
        </View>
      </View> */}
    </View>
  );
};

export const PolaroidCard = ({ user, themeColor }: TemplateCardProps) => {
  const mbtiTag = user.personal_info.mbti === 'UNKNOWN' ? '' : '#' + MBTI_OPTIONS.find(option => option.value === user.personal_info.mbti)?.value + ' ';
  let isDefault = themeColor === colors.background;
  if (isDefault) themeColor = '#64686E';

  // Washi tape color (semi-transparent version of theme)
  const tapeColor = themeColor + '90';

  return (
    <View style={[styles.templateCard, styles.polaroidCard]}> 
      {/* The Washi Tape (Decorative) */}
      <View style={[styles.polaroidTape, { backgroundColor: tapeColor }]} />

      {/* The Photo Area */}
      <View style={styles.polaroidImageFrame}>
        <Image source={{ uri: user.personal_info.avatar_url }} style={styles.polaroidImage} blurRadius={PHOTO_BLUR_AMOUNT + 15} />
        <View style={styles.polaroidOverlay}>
          <LogoIcon size={120} floatingY={0} stroke={isDefault ? colors.background : themeColor} />
        </View>
      </View>

      {/* The Handwritten Area */}
      <View style={styles.polaroidTextArea}>
        <View style={styles.polaroidHeaderRow}>
          <Text style={[styles.polaroidUsername, { color: themeColor }]}>{user.username}</Text>
          {/* <Text style={styles.polaroidDate}>{GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text> */}
        </View>

        <Text style={styles.polaroidBio} numberOfLines={4}>
          {user.personal_info.bio}
        </Text>

        {/* Hand-drawn style separator */}
        <View style={[styles.polaroidLine, { backgroundColor: themeColor + '40' }]} />

        <Text style={styles.polaroidTagLine} numberOfLines={2}>
          My Vibe: {mbtiTag}{user.personal_info.interests.slice(0, 3).map((i: string) => i.startsWith('#') ? i : INTEREST_TAGS.find(tag => tag.id === i)?.label).join(' • ')}
        </Text>
      </View>
    </View>
  );
};

export const TicketCard = ({ user, themeColor }: TemplateCardProps) => {
  const mbtiTag = user.personal_info.mbti === 'UNKNOWN' ? '' : '#' + MBTI_OPTIONS.find(option => option.value === user.personal_info.mbti)?.value + ' ';
  let isDefault = themeColor === colors.background;
  if (isDefault) themeColor = colors.text;

  // Fixed barcode pattern for consistent rendering
  const barcodeBars = [ { width: 2, height: 30 }, { width: 1, height: 30 }, { width: 2, height: 30 }, { width: 3, height: 30 }, { width: 2, height: 30 }, { width: 4, height: 30 }, { width: 1, height: 30 }, { width: 3, height: 30 }, { width: 2, height: 30 }, { width: 4, height: 30 }, { width: 1, height: 30 }, { width: 3, height: 30 }, { width: 2, height: 30 }, { width: 4, height: 30 }, { width: 2, height: 30 } ];

  return (
    <View style={[styles.templateCard, styles.ticketCard, { backgroundColor: colors.card }]}> 

      {/* Left colored stripe */}
      <View style={[styles.ticketStripe, { backgroundColor: themeColor }]} />

      {/* Main Content */}
      <View style={styles.ticketContent}>

        {/* Header: "Admit One" style */}
        <View style={styles.ticketHeader}>
          <View>
            <Text style={[styles.ticketLabel, { color: themeColor }]}>PASSENGER</Text>
            <Text style={styles.ticketUsername}>{user.username}</Text>
          </View>
          <View style={[styles.ticketAvatarContainer, { borderColor: themeColor }]}>
            <Image source={{ uri: user.personal_info.avatar_url }} style={styles.ticketAvatar} blurRadius={PHOTO_BLUR_AMOUNT} />
            <View style={styles.ticketAvatarOverlay}>
              <LogoIcon size={20} floatingY={0} stroke={isDefault ? colors.background : themeColor} />
            </View>
          </View>
        </View>

        {/* Dashed Line Divider */}
        <View style={styles.ticketDividerContainer}>
          {/* The "Cutouts" to make it look like paper */}
          <View style={[styles.ticketCutout, { left: -24, backgroundColor: colors.background }]} />
          <View style={[styles.ticketDashedLine, { borderColor: themeColor }]} />
          <View style={[styles.ticketCutout, { right: -24, backgroundColor: colors.background }]} />
        </View>

        {/* Body Info */}
        <View style={styles.ticketBody}>
          <Text style={[styles.ticketLabel, { color: themeColor }]}>MEMO</Text>
          <Text style={styles.ticketBio} numberOfLines={7}>{user.personal_info.bio}</Text>

          <View style={styles.ticketDataGrid}>
            <View style={styles.ticketDataItem}>
              <Text style={[styles.ticketLabel, { color: themeColor }]}>WHERE I LIVE</Text>
              <Text style={styles.ticketBio} numberOfLines={1}>✓ {user.personal_info.custom_question.love}</Text>
              <Text style={styles.ticketBio} numberOfLines={1}>✗ {user.personal_info.custom_question.hate}</Text>
            </View>
          </View>

          {/* Tags as "Zones" */}
          <View style={styles.ticketTagsRow}>
            {[mbtiTag, ...user.personal_info.interests.slice(0, 3)].filter(Boolean).map((tag: string, i: number) => (
              <View key={i} style={[styles.ticketTagBox, { borderColor: themeColor }]}>
                <Text style={[styles.ticketTagText, { color: themeColor }]}>
                  {tag.startsWith('#') ? tag : INTEREST_TAGS.find(t => t.id === tag)?.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Barcode Footer */}
        <View style={styles.ticketFooter}>
          {/* Fake Barcode (Just views) */}
          <View style={{ flexDirection: 'row', gap: 3, opacity: 0.3, alignItems: 'flex-end' }}>
            {barcodeBars.map((bar, i) => (
              <View key={i} style={{
                width: bar.width,
                height: bar.height,
                backgroundColor: colors.text
              }} />
            ))}
          </View>

          {/* Generation - Bottom Right (Stamp) */}
          {/* <View style={[styles.ticketStampContainer, { borderColor: themeColor }]}>
            <Text style={[styles.ticketStampText, { color: themeColor }]}>{GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text>
          </View> */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  templateCard: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  // classic
  classicCard: {
    padding: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
  },
  classicLeftLine: {
    width: 1.5,
    height: '100%',
    marginRight: 20,
  },
  classicContentContainer: {
    paddingVertical: 8,
    flex: 1,
    gap: 8,
  },
  classicContentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  classicContentGenerationContainer: {
  },
  classicContentGenerationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Merriweather-Italic',
  },
  classicContentAvatarContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
  },
  classicContentAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  classicContentAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classicContentHeading: {
    // Heading container
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classicContentHeadingText: {
    fontSize: 24,
    fontFamily: 'Merriweather-Bold',
  },
  classicContentBody: {
    // Body container
    marginTop: 4,
  },
  classicContentBodyTitle: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: colors.text,
    marginTop: 4,
    // fontWeight: '200'
  },
  classicContentBodyText: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: colors.text,
    lineHeight: 19,
    fontWeight: '200',
    marginTop: 4,
  },
  // quote
  quoteCard: {
    padding: 16,
    gap: 12,
    // overflow: 'hidden',
  },
  quoteBackgroundSymbol: {
    position: 'absolute',
  },
  quoteBackgroundSymbolText: {
    fontSize: 200,
    fontFamily: 'NotoSerifJP-Bold',
    color: colors.textSecondary,
    opacity: 0.1,
  },
  quoteTagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  quoteTagText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'NotoSerifJP',
  },
  quoteContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  quoteContentText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    fontFamily: 'NotoSerifJP',
    letterSpacing: 0.5,
  },
  quoteContentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 8,
  },
  quoteContentAuthorAvatarContainer: {
    position: 'relative',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteContentAuthorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    borderWidth: 1,
  },
  quoteContentAuthorAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteContentAuthorName: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 0.5,
  },
  quoteContentAuthorGeneration: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  // zine
  zineCard: {
    padding: 16,
    position: 'relative',
  },
  zineAvatarContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  zineAvatarWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  zineAvatar: {
    width: '100%',
    height: '100%',
  },
  zineAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zineBioContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
    width: '64%',
  },
  zineSticker: {
    padding: 12,
  },
  zineBioText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'MPLUSRounded1c',
    letterSpacing: 0.5,
  },
  zineInterestsContainerWrapper: {
    position: 'absolute',
    left: 16,
    bottom: '16%',
    height: '48%',
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  zineInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  zineInterestTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  zineInterestText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'MPLUSRounded1c',
  },
  zineCityContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    width: '45%',
  },
  zineCityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
    fontFamily: 'MPLUSRounded1c',
  },
  zineCityText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 18,
    marginTop: 4,
    fontFamily: 'MPLUSRounded1c',
  },
  zineUsernameContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
  },
  zineUsername: {
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  zineGenerationContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
  },
  zineGenerationSticker: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zineGenerationText: {
    fontSize: 13,
    color: colors.text,
  },
  // --- Polaroid Styles ---
  polaroidCard: {
    backgroundColor: '#F8F9FA', // Off-white photo paper look
    padding: 16,
    alignItems: 'center',
    paddingTop: 24, // Space for tape
  },
  polaroidTape: {
    position: 'absolute',
    top: -10,
    width: 80,
    height: 25,
    transform: [{ rotate: '-3deg' }],
    opacity: 0.8,
    zIndex: 10,
  },
  polaroidImageFrame: {
    width: '75%',
    aspectRatio: 1, // Square photo
    backgroundColor: '#000',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
  },
  polaroidOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  polaroidTextArea: {
    width: '100%',
    flex: 1,
  },
  polaroidHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  polaroidUsername: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'serif', // Handwriting style
    fontWeight: 'bold',
  },
  polaroidDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'serif',
  },
  polaroidBio: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'MPLUSRounded1c',
    marginBottom: 12,
  },
  polaroidLine: {
    width: '100%',
    height: 1,
    marginBottom: 12,
  },
  polaroidTagLine: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: 'MPLUSRounded1c',
  },
  // --- Ticket Styles ---
  ticketCard: {
    flexDirection: 'row',
    overflow: 'hidden', // Contain the content
  },
  ticketStripe: {
    width: 12,
    height: '100%',
    opacity: 0.8,
  },
  ticketContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
    marginTop: 8,
  },
  ticketUsername: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Tech/Ticket font
  },
  ticketAvatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  ticketAvatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketAvatar: {
    width: '100%',
    height: '100%',
  },
  ticketDividerContainer: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  ticketDashedLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  ticketCutout: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 10,
  },
  ticketBody: {
    flex: 1,
    paddingVertical: 8,
  },
  ticketBio: {
    fontSize: 14,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  ticketDataGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  ticketDataItem: {
    // 
  },
  ticketValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  ticketTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ticketTagBox: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ticketTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  ticketStampContainer: {
    transform: [{ rotate: '-4deg' }],
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  ticketStampText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
})
