import type { Text } from "./match.ts";

// Letters: H/T time, A/O stage, C/B mood, L/F pace.
export const TRAVEL_TYPES: Record<string, { name: Text; line: Text }> = {
  HACL: { name: { en: "The Alley Scholar", ko: "골목 탐독가" }, line: { en: "You read a city through its old doors and quiet workshops.", ko: "오래된 문과 조용한 공방으로 도시를 읽는 사람." } },
  HACF: { name: { en: "The Old-Sign Collector", ko: "옛 간판 수집가" }, line: { en: "You hunt faded signs and family shops, one alley after another.", ko: "빛바랜 간판과 대를 이은 가게를 찾아 골목을 누비는 사람." } },
  HABL: { name: { en: "The Market Regular", ko: "시장 단골" }, line: { en: "You pull up a stool and let the market feed you.", ko: "시장 한편에 자리를 잡고, 차려 주는 대로 맛보는 사람." } },
  HABF: { name: { en: "The Night-Market Runner", ko: "밤 시장 순례자" }, line: { en: "Old streets, late nights, one more stall.", ko: "오래된 거리와 늦은 밤, 그리고 한 곳만 더." } },
  HOCL: { name: { en: "The Wall Walker", ko: "성곽 산책자" }, line: { en: "You follow fortress walls and mountain paths at your own pace.", ko: "성곽과 산길을 내 걸음대로 따라 걷는 사람." } },
  HOCF: { name: { en: "The Ridge Rambler", ko: "능선 여행자" }, line: { en: "Temples, trails and old stones, as many as the day allows.", ko: "산사와 산길과 옛 돌길을, 하루가 허락하는 만큼." } },
  HOBL: { name: { en: "The Pavilion Host", ko: "정자의 단골" }, line: { en: "You find the old garden where everyone gathers, and stay.", ko: "사람들이 모이는 옛 정원을 찾아 오래 머무는 사람." } },
  HOBF: { name: { en: "The Lantern Chaser", ko: "등불 여행자" }, line: { en: "Festivals, night walks and history under the open sky.", ko: "축제와 밤 산책, 그리고 열린 하늘 아래의 역사." } },
  TACL: { name: { en: "The Studio Dweller", ko: "작업실 단골" }, line: { en: "You settle into one good studio or café and watch the neighborhood.", ko: "좋은 작업실이나 카페 한 곳에 머물며 동네를 바라보는 사람." } },
  TACF: { name: { en: "The Workshop Hopper", ko: "공방 순례자" }, line: { en: "From one maker's space to the next, you collect new ideas.", ko: "이 공방에서 저 공방으로, 새로운 생각을 모으는 사람." } },
  TABL: { name: { en: "The Indie Regular", ko: "인디 단골" }, line: { en: "A favorite bar, a local band, a neighborhood that feels like yours.", ko: "단골 바와 동네 밴드, 내 동네처럼 편한 거리." } },
  TABF: { name: { en: "The Rooftop Hopper", ko: "루프톱 순례자" }, line: { en: "New alleys, new rooftops, new friends by midnight.", ko: "새로운 골목과 새로운 옥상, 자정 무렵엔 새 친구까지." } },
  TOCL: { name: { en: "The River Reader", ko: "강변 독서가" }, line: { en: "A book, the Han River and nowhere else to be.", ko: "책 한 권과 한강, 그리고 서두를 일 없는 오후." } },
  TOCF: { name: { en: "The City Cyclist", ko: "도시 라이더" }, line: { en: "You cover the city along its streams and new parks.", ko: "하천과 새 공원을 따라 도시를 누비는 사람." } },
  TOBL: { name: { en: "The Riverside Host", ko: "한강 피크닉 호스트" }, line: { en: "You set up the picnic and the city comes to you.", ko: "돗자리를 펴 두면 사람들이 모여드는 사람." } },
  TOBF: { name: { en: "The River Runner", ko: "강변 러너" }, line: { en: "Sunrise runs, open views and a packed day after.", ko: "해 뜰 무렵의 달리기, 탁 트인 풍경, 그리고 꽉 찬 하루." } },
};
