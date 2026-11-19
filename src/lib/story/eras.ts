import type { Text } from "../match/match.ts";
import type { Photo } from "../districts/courses.ts";

/**
 * Seoul Story: the team's research (2026-11 document), condensed to seven scenes.
 * Dates checked: Baekje's capital from 18 BCE (traditional date) to 475, Hanyang from 1394,
 * the Korean Empire in 1897, colonial rule 1910–1945, the Republic in 1948, the war 1950–1953,
 * subway Line 1 in 1974, the Olympics in 1988, Cheonggyecheon restored in 2005.
 */

export interface Place {
  name: Text;
  // The district it is in; when that district's day course includes the place, it links there.
  district: string;
  inCourse?: boolean;
}

export interface Era {
  id: string;
  mark: Text; // the big label
  span: Text; // the full range
  title: Text;
  cityName?: Text; // what the city was called then
  summary: Text;
  places: Place[];
  photo?: Photo;
}

export const STORY = {
  title: { en: "Two thousand years of Seoul", ko: "2천 년의 서울" },
  intro: {
    en: "From Baekje's first capital to Joseon's Hanyang and the city of today. Two thousand years of Seoul, in seven scenes.",
    ko: "백제의 첫 도읍에서 조선의 한양, 그리고 오늘의 서울까지. 2천 년 동안 이어진 도시의 이야기를 일곱 장면으로 정리했습니다.",
  },
  closing: {
    en: "A city where two thousand years are still alive. Meet the past in its palaces and alleys, and walk today's Seoul in its streets.",
    ko: "2천 년의 역사가 살아 숨 쉬는 도시, 서울. 궁궐과 골목에서 과거를 만나고, 오늘의 거리에서 지금의 서울을 걸어 보세요.",
  },
};

const img = (src: string, width: number, height: number, en: string, ko: string, credit?: Photo["credit"]): Photo => ({
  src,
  width,
  height,
  alt: { en, ko },
  ...(credit ? { credit } : {}),
});

export const ERAS: Era[] = [
  {
    id: "prehistory",
    mark: { en: "Prehistory", ko: "선사시대" },
    span: { en: "Thousands of years ago", ko: "수천 년 전" },
    title: { en: "It began on the Han River", ko: "한강에서 시작된 서울" },
    summary: {
      en: "Seoul's story begins on the banks of the Han, where the river gave water, food and a place to settle. At Amsa-dong, the remains of Neolithic pit houses still mark where people lived.",
      ko: "서울의 역사는 물과 먹을거리가 풍부한 한강 변에서 시작됐습니다. 강동구 암사동에는 신석기시대 사람들이 살던 움집 터가 남아 있습니다.",
    },
    places: [{ name: { en: "Amsa-dong Prehistoric Settlement", ko: "서울 암사동 유적" }, district: "gangdong" }],
    photo: img("/story/amsa.jpg", 960, 720, "Rebuilt Neolithic pit houses at Amsa-dong", "암사동 유적에 다시 지은 신석기시대 움집", {
      by: "G41rn8",
      license: "CC BY-SA 4.0",
      url: "https://commons.wikimedia.org/wiki/File:Amsadong_IMG_2081.jpg",
    }),
  },
  {
    id: "baekje",
    mark: { en: "18 BCE", ko: "기원전 18년" },
    span: { en: "18 BCE – 475", ko: "기원전 18년 – 475년" },
    title: { en: "Hanseong, capital of Baekje", ko: "백제의 수도, 한성" },
    cityName: { en: "Wiryeseong · Hanseong", ko: "위례성 · 한성" },
    summary: {
      en: "The Baekje kingdom built its first capital here and ruled from it for nearly five hundred years. Its earthen walls and royal tombs still stand in Songpa.",
      ko: "백제는 지금의 서울에 첫 도읍을 세우고 약 500년 동안 이곳을 정치와 문화의 중심으로 삼았습니다. 그때의 토성과 고분이 지금도 송파에 남아 있습니다.",
    },
    places: [
      { name: { en: "Mongchontoseong and the Hanseong Baekje Museum", ko: "몽촌토성과 한성백제박물관" }, district: "songpa", inCourse: true },
      { name: { en: "Seokchon-dong Ancient Tombs", ko: "석촌동 고분군" }, district: "songpa", inCourse: true },
      { name: { en: "Pungnaptoseong", ko: "풍납토성" }, district: "songpa" },
    ],
    photo: img("/districts/songpa/mongchontoseong.jpg", 960, 638, "The grassy walls of Mongchontoseong", "몽촌토성의 풀 덮인 성벽", {
      by: "Saigen Jiro",
      license: "CC0",
      url: "https://commons.wikimedia.org/wiki/File:Seoul_Mongchon_Toseong-1.JPG",
    }),
  },
  {
    id: "joseon",
    mark: { en: "1394", ko: "1394년" },
    span: { en: "1394 – 19th century", ko: "1394년 – 19세기" },
    title: { en: "Hanyang, capital of Joseon", ko: "조선의 수도, 한양" },
    cityName: { en: "Hanyang", ko: "한양" },
    summary: {
      en: "In 1394 King Taejo made Hanyang the capital of Joseon. Gyeongbokgung, the royal shrine Jongmyo and the city wall were built, shaping what is still Seoul's historic heart.",
      ko: "1394년 조선의 태조가 한양을 새 수도로 정했습니다. 경복궁과 종묘, 한양도성이 세워지며 지금 서울의 옛 중심이 만들어졌습니다.",
    },
    places: [
      { name: { en: "Gyeongbokgung Palace", ko: "경복궁" }, district: "jongno", inCourse: true },
      { name: { en: "Insa-dong", ko: "인사동" }, district: "jongno", inCourse: true },
      { name: { en: "Changdeokgung and Jongmyo", ko: "창덕궁과 종묘" }, district: "jongno" },
      { name: { en: "Bukchon Hanok Village", ko: "북촌한옥마을" }, district: "jongno" },
    ],
    photo: img("/story/changdeokgung.jpg", 1200, 799, "Donhwamun, the main gate of Changdeokgung, in autumn", "가을의 창덕궁 정문 돈화문"),
  },
  {
    id: "modern",
    mark: { en: "1897", ko: "1897년" },
    span: { en: "1897 – 1945", ko: "1897년 – 1945년" },
    title: { en: "A modern city, then colonial rule", ko: "근대화와 일제강점기" },
    cityName: { en: "Gyeongseong", ko: "경성" },
    summary: {
      en: "Streetcars, electric light and Western buildings arrived in the late 1800s, and the Korean Empire was declared in 1897. From 1910 to 1945 Korea was under Japanese rule, the city was called Gyeongseong, and many fought for independence.",
      ko: "19세기 말 전차와 전기, 서양식 건물이 들어오고 1897년 대한제국이 세워졌습니다. 1910년부터 1945년까지는 일본의 식민 지배 아래 '경성'으로 불렸고, 많은 사람이 독립을 위해 싸웠습니다.",
    },
    places: [
      { name: { en: "Deoksugung Palace", ko: "덕수궁" }, district: "jung" },
      { name: { en: "Seodaemun Prison History Hall", ko: "서대문형무소역사관" }, district: "seodaemun" },
    ],
    photo: img("/story/seodaemun-prison.jpg", 960, 640, "The brick cell blocks of the old Seodaemun Prison, with a Korean flag hung on the wall", "태극기가 걸린 옛 서대문형무소 옥사", {
      by: "Noh Mun Duek",
      license: "CC BY-SA 4.0",
      url: "https://commons.wikimedia.org/wiki/File:Overview_of_the_Old_Seodaemun_Prison_(%EA%B5%AC%EC%84%9C%EB%8C%80%EB%AC%B8%ED%98%95%EB%AC%B4%EC%86%8C).jpg",
    }),
  },
  {
    id: "liberation",
    mark: { en: "1945", ko: "1945년" },
    span: { en: "1945 – 1953", ko: "1945년 – 1953년" },
    title: { en: "Liberation and the Korean War", ko: "광복과 한국전쟁" },
    cityName: { en: "Seoul", ko: "서울" },
    summary: {
      en: "Korea was liberated in 1945, and in 1948 the Republic of Korea was founded with Seoul as its capital. The war that began in 1950 left much of the city in ruins; after the fighting stopped in 1953, rebuilding began.",
      ko: "1945년 광복을 맞았고, 1948년 대한민국 정부가 세워지며 서울이 수도가 됐습니다. 1950년 시작된 한국전쟁으로 도시 대부분이 부서졌고, 1953년 전쟁이 멈춘 뒤 재건이 시작됐습니다.",
    },
    places: [
      { name: { en: "War Memorial of Korea", ko: "전쟁기념관" }, district: "yongsan" },
      { name: { en: "Seoul Museum of History", ko: "서울역사박물관" }, district: "jongno" },
    ],
    photo: img("/story/seoul-1951.jpg", 960, 656, "A woman searching the ruins of Seoul for salvage during the Korean War", "한국전쟁 중 폐허가 된 서울에서 쓸 만한 것을 찾는 여인", {
      by: "Capt. C. W. Huff, U.S. Army",
      license: "Public domain",
      url: "https://commons.wikimedia.org/wiki/File:An_aged_Korean_woman_pauses_in_her_search_for_salvageable_materials_among_the_ruins_of_Seoul,_Korea_HD-SN-99-03163.jpg",
    }),
  },
  {
    id: "miracle",
    mark: { en: "1960s", ko: "1960년대" },
    span: { en: "1960s – 1988", ko: "1960년대 – 1988년" },
    title: { en: "The Miracle on the Han River", ko: "한강의 기적" },
    summary: {
      en: "From the 1960s the economy grew at speed, and the riverbanks and Gangnam were built up. Subway Line 1 opened in 1974, and the 1988 Olympics introduced Seoul to the world.",
      ko: "1960년대부터 경제가 빠르게 성장하며 한강 변과 강남이 개발됐습니다. 1974년 지하철 1호선이 개통했고, 1988년 서울올림픽은 서울을 세계에 알렸습니다.",
    },
    places: [
      { name: { en: "Olympic Park", ko: "올림픽공원" }, district: "songpa", inCourse: true },
      { name: { en: "Gangnam", ko: "강남" }, district: "gangnam", inCourse: true },
      { name: { en: "Yeouido Hangang Park", ko: "여의도한강공원" }, district: "yeongdeungpo", inCourse: true },
    ],
    photo: img("/story/olympic-park.jpg", 960, 540, "The Olympic Park sign, with the World Peace Gate behind", "올림픽공원 표지와 그 뒤의 평화의 문", {
      by: "Silas Low",
      license: "CC BY-SA 4.0",
      url: "https://commons.wikimedia.org/wiki/File:Olympic_Park_Seoul.jpg",
    }),
  },
  {
    id: "today",
    mark: { en: "2000s", ko: "2000년대" },
    span: { en: "2000s – today", ko: "2000년대 – 오늘" },
    title: { en: "Where tradition meets the new", ko: "전통과 현대가 함께하는 도시" },
    summary: {
      en: "Seoul has kept its past while building something new, as when the Cheonggyecheon stream was brought back to downtown in 2005. Today the city is where K-pop, drama, food, fashion and art meet visitors from everywhere.",
      ko: "2005년 도심 한가운데 청계천이 다시 흐르게 된 것처럼, 서울은 옛 흔적을 지키며 새로운 도시를 만들어 왔습니다. 오늘의 서울에서는 K-팝과 드라마, 음식, 패션, 예술까지 한국 문화를 가까이서 만날 수 있습니다.",
    },
    places: [
      { name: { en: "Cheonggyecheon", ko: "청계천" }, district: "jung", inCourse: true },
      { name: { en: "Seongsu-dong", ko: "성수동" }, district: "seongdong", inCourse: true },
      { name: { en: "Myeongdong", ko: "명동" }, district: "jung", inCourse: true },
    ],
    photo: img("/districts/jung/cheonggyecheon.jpg", 900, 472, "Cheonggyecheon lit up at night", "조명이 켜진 청계천"),
  },
];
