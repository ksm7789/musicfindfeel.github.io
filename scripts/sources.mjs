// 자동 갱신 설정
// 차트에 잘 잡히지 않는 세대의 "지금 듣는 곡"은 아래 가수들의 최근 발매곡으로 보완한다.
// 가수를 추가하거나 빼려면 이 목록만 고치면 된다.

export const WATCH_ARTISTS = [
  // 20~30대 · 발라드 · 밴드 · 인디
  { name: "아이유", ages: "20 30 40" },
  { name: "DAY6", ages: "20 30" },
  { name: "폴킴", ages: "20 30" },
  { name: "이무진", ages: "20 30" },
  { name: "잔나비", ages: "20 30" },
  { name: "AKMU", ages: "10 20 30" },
  { name: "10CM", ages: "20 30" },
  { name: "멜로망스", ages: "20 30" },
  { name: "태연", ages: "20 30" },
  { name: "헤이즈", ages: "20 30" },
  { name: "윤하", ages: "20 30" },
  { name: "비비", ages: "10 20 30" },
  { name: "너드커넥션", ages: "20 30" },
  { name: "볼빨간사춘기", ages: "20 30" },
  { name: "정승환", ages: "20 30" },
  { name: "이창섭", ages: "20 30" },
  { name: "QWER", ages: "10 20" },
  { name: "황가람", ages: "20 30 40" },
  // 30~40대
  { name: "성시경", ages: "30 40" },
  { name: "박효신", ages: "30 40" },
  { name: "백지영", ages: "30 40" },
  { name: "로이킴", ages: "20 30 40" },
  { name: "임재현", ages: "30 40" },
  { name: "이소라", ages: "30 40 50" },
  { name: "윤종신", ages: "30 40 50" },
  { name: "김범수", ages: "30 40" },
  { name: "나얼", ages: "30 40" },
  { name: "거미", ages: "30 40" },
  { name: "다비치", ages: "30 40" },
  { name: "에일리", ages: "30 40" },
  { name: "케이윌", ages: "30 40" },
  { name: "버즈", ages: "30 40" },
  { name: "임창정", ages: "30 40 50" },
  { name: "장범준", ages: "20 30 40" },
  { name: "이승철", ages: "40 50" },
  { name: "신승훈", ages: "40 50" },
  // 40~60대 이상 · 트로트 · 대중가요
  { name: "임영웅", ages: "40 50 60" },
  { name: "영탁", ages: "40 50 60" },
  { name: "이찬원", ages: "40 50 60" },
  { name: "송가인", ages: "40 50 60" },
  { name: "장윤정", ages: "40 50 60" },
  { name: "정동원", ages: "40 50 60" },
  { name: "장민호", ages: "50 60" },
  { name: "김희재", ages: "40 50 60" },
  { name: "양지은", ages: "50 60" },
  { name: "홍지윤", ages: "50 60" },
  { name: "정서주", ages: "50 60" },
  { name: "손태진", ages: "40 50 60" },
  { name: "안성훈", ages: "50 60" },
  { name: "박지현", ages: "50 60" },
  { name: "박서진", ages: "50 60" },
  { name: "신유", ages: "50 60" },
  { name: "조항조", ages: "50 60" },
  { name: "조용필", ages: "40 50 60" },
  { name: "나훈아", ages: "50 60" },
  { name: "이문세", ages: "40 50 60" },
  { name: "최백호", ages: "50 60" },
  { name: "김연자", ages: "50 60" },
  { name: "진성", ages: "50 60" },
  { name: "주현미", ages: "50 60" },
  { name: "남진", ages: "60" },
  { name: "심수봉", ages: "50 60" },
  { name: "양희은", ages: "50 60" },
  { name: "인순이", ages: "50 60" },
];

// Last.fm 한국 주간 인기곡에서 가져올 곡 수 (LASTFM_API_KEY 필요)
export const LASTFM_KR_LIMIT = 200;

// 최근 발매곡으로 인정하는 기간(개월)
export const RECENT_MONTHS = 30;
// 가수 한 명당 가져올 최근곡 수
export const PER_ARTIST = 3;

// Last.fm 태그 → 기분 (영어·한국어 태그 모두)
export const TAG_MOODS = {
  happy: ["happy", "upbeat", "feel good", "cheerful", "fun", "summer", "bright", "신나는", "밝은", "행복"],
  sad: ["sad", "melancholy", "heartbreak", "breakup", "tearjerker", "emotional", "depressing", "슬픈", "이별"],
  relaxed: ["chill", "relaxing", "mellow", "calm", "soft", "acoustic", "lofi", "lo-fi", "cozy", "잔잔한", "편안한"],
  energetic: ["energetic", "dance", "hype", "workout", "party", "rock", "anthem", "upbeat dance", "신나는", "파워풀"],
  lonely: ["lonely", "night", "nostalgic", "nostalgia", "longing", "rainy", "autumn", "새벽", "그리움", "외로움"],
  angry: ["angry", "aggressive", "intense", "girl crush", "dark", "powerful", "hardcore", "걸크러쉬"],
  love: ["love", "romantic", "sweet", "cute", "crush", "love songs", "설렘", "사랑"],
  focus: ["instrumental", "ambient", "study", "piano", "classical", "focus", "concentration", "연주곡"],
};

// 장르 → 기분 (태그가 없을 때의 기본값)
export const GENRE_MOODS = [
  [/발라드|ballad/i, ["sad", "love"]],
  [/트로트|trot/i, ["happy", "energetic"]],
  [/힙합|랩|hip-?hop|rap/i, ["energetic", "angry"]],
  [/알앤비|r&b|소울|soul/i, ["love", "relaxed"]],
  [/인디|indie|포크|folk|어쿠스틱/i, ["relaxed", "lonely"]],
  [/록|rock|메탈|metal|밴드/i, ["energetic"]],
  [/재즈|jazz/i, ["relaxed", "focus"]],
  [/클래식|classical|뉴에이지|new age|연주/i, ["focus", "relaxed"]],
  [/댄스|dance|일렉트로닉|electronic/i, ["energetic", "happy"]],
  [/OST|사운드트랙|soundtrack/i, ["sad", "love"]],
  [/k-?pop|가요|팝|pop/i, ["happy", "energetic"]],
];

// 제목 속 단어 → 기분 (보조 신호)
export const TITLE_MOODS = [
  [/이별|안녕|눈물|울|그만|헤어|아파|잊/, "sad"],
  [/밤|새벽|혼자|그리워|기억|추억|비 /, "lonely"],
  [/사랑|love|좋아|설레|crush|heart|kiss/i, "love"],
  [/happy|행복|웃|봄|sunny|summer|party/i, "happy"],
];
