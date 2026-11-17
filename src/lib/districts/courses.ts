import type { Text } from "../match/match.ts";

/**
 * Day courses researched by the team (2026-11 documents), checked and adjusted on 2026-11-17:
 * every stop sits inside its district, the order follows a walkable line, and anything that
 * changes often (pop-ups, opening hours, prices) is marked as such.
 */

export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: Text;
}

export interface Stop {
  time: string; // 24-hour clock, the suggested arrival
  name: Text;
  kind: Text;
  body: Text;
  tip?: Text;
  photo?: Photo;
  // How to get here from the previous stop.
  way?: Text;
}

export interface Course {
  slug: string;
  area: Text;
  title: Text;
  intro: Text;
  length: Text;
  start: Text;
  stops: Stop[];
  // Places the team found that sit just across the district line.
  nearby?: Text;
}

const photo = (slug: string, file: string, width: number, height: number, en: string, ko: string): Photo => ({
  src: `/districts/${slug}/${file}.jpg`,
  width,
  height,
  alt: { en, ko },
});

export const CHECKED = { en: "November 2026", ko: "2026년 11월" };

export const COURSES: Course[] = [
  {
    slug: "seongdong",
    area: { en: "Seongsu-dong", ko: "성수동" },
    title: { en: "Old factories, new workshops", ko: "공장 동네가 공방과 카페의 거리로" },
    intro: {
      en: "Seongsu was a district of shoe factories and metal shops. Many of those buildings are now cafés, pop-up stores and studios, and the shoemakers are still here. Start in a forest, end by the Han River.",
      ko: "성수동은 구두 공장과 금속 공장이 모여 있던 동네입니다. 그 건물들이 지금은 카페와 팝업스토어, 작업실이 되었고, 구두 장인들은 여전히 이 거리에 있습니다. 숲에서 시작해 한강에서 하루를 마칩니다.",
    },
    length: { en: "About 9 hours", ko: "약 9시간" },
    start: { en: "Seoul Forest Station, Suin-Bundang Line", ko: "수인분당선 서울숲역" },
    stops: [
      {
        time: "11:00",
        name: { en: "Seoul Forest", ko: "서울숲" },
        kind: { en: "Park", ko: "공원" },
        body: {
          en: "Open the day with an easy walk. Ponds, wide lawns and forest paths, right in the middle of the city.",
          ko: "가벼운 산책으로 하루를 엽니다. 연못과 넓은 잔디밭, 숲길이 도심 한가운데 펼쳐져 있습니다.",
        },
        photo: photo("seongdong", "seoul-forest", 396, 273, "Ponds and trees in Seoul Forest", "서울숲의 연못과 나무들"),
      },
      {
        time: "12:30",
        name: { en: "Yeonmujang-gil and Seongsu Yeonbang", ko: "연무장길과 성수연방" },
        kind: { en: "Shops and lunch", ko: "쇼핑과 점심" },
        body: {
          en: "Seongsu's main street, lined with design shops, perfume stores and pop-ups from big brands. Seongsu Yeonbang is an old factory turned into shops and restaurants. Have lunch along the street.",
          ko: "감각적인 편집숍과 향수 가게, 대기업과 브랜드의 팝업스토어가 늘어선 성수의 중심 거리입니다. 성수연방은 옛 공장을 고친 복합공간입니다. 점심도 이 거리에서 해결합니다.",
        },
        tip: {
          en: "Pop-ups change every few weeks, so there is always something new.",
          ko: "팝업스토어는 몇 주마다 바뀌어서 갈 때마다 새로운 곳이 열려 있습니다.",
        },
        way: { en: "Walk 15 min", ko: "걸어서 15분" },
        photo: photo("seongdong", "seongsu-yeonbang", 311, 307, "Inside Seongsu Yeonbang, a converted factory", "옛 공장을 고친 성수연방 내부"),
      },
      {
        time: "14:30",
        name: { en: "Seongsu Handmade Shoe Street", ko: "성수 수제화 거리" },
        kind: { en: "Workshops", ko: "공방" },
        body: {
          en: "Around exits 1 and 2 of Seongsu Station, hundreds of shoemakers have worked for decades. Browse the shared showrooms under the elevated tracks, or join a class at the Handmade Shoe Hope Platform.",
          ko: "성수역 1·2번 출구 일대에는 수백 곳의 구두 공방이 수십 년째 일하고 있습니다. 고가 아래 공동매장을 둘러보거나, 성수 수제화 희망플랫폼의 체험 공방에 들러 보세요.",
        },
        tip: {
          en: "Class times change, so check before you go.",
          ko: "체험 프로그램 일정은 방문 전에 확인하세요.",
        },
        way: { en: "Walk 10 min", ko: "걸어서 10분" },
      },
      {
        time: "15:30",
        name: { en: "A café in an old factory", ko: "공장을 고친 카페" },
        kind: { en: "Café", ko: "카페" },
        body: {
          en: "Seongsu is known for large bakery cafés in former factories. Try Onion Seongsu, once a metal works, or The House of Terarosa Seoul. Rest with a signature pastry and a drink.",
          ko: "성수동 하면 폐공장을 고친 대형 베이커리 카페입니다. 옛 금속 공장이던 어니언 성수나 더 하우스 오브 테라로사 서울에서 시그니처 빵과 음료로 쉬어 갑니다.",
        },
        tip: {
          en: "Weekend queues can take 20 minutes or more.",
          ko: "주말에는 주문 줄이 20분 넘게 걸리기도 합니다.",
        },
        way: { en: "Walk 5 min", ko: "걸어서 5분" },
        photo: photo("seongdong", "factory-cafe", 329, 219, "A café front in Seongsu", "성수동의 카페 입구"),
      },
      {
        time: "18:00",
        name: { en: "Seongsu pork galbi alley", ko: "성수동 돼지갈비 골목" },
        kind: { en: "Dinner", ko: "저녁" },
        body: {
          en: "Near Ttukseom Station, old galbi houses grill marinated pork ribs at outdoor tables. Daesung Galbi is the best known.",
          ko: "뚝섬역 근처, 오래된 갈비집들이 골목 바깥 테이블에서 양념 돼지갈비를 굽습니다. 대성갈비가 가장 잘 알려져 있습니다.",
        },
        way: { en: "Walk 15 min", ko: "걸어서 15분" },
      },
      {
        time: "19:30",
        name: { en: "Ttukseom Hangang Park at night", ko: "뚝섬한강공원 야경" },
        kind: { en: "Riverside", ko: "한강" },
        body: {
          en: "Walk off dinner by the Han River and watch the bridges light up. The main riverside area is right outside Jayang Station on Line 7.",
          ko: "한강 바람을 맞으며 소화도 시키고, 불이 켜진 다리들을 보며 하루를 마무리합니다. 공원 중심은 7호선 자양역 바로 앞입니다.",
        },
        way: { en: "Bus or Line 7, 15 min · or walk 35 min", ko: "버스나 7호선으로 15분 · 걸어서 35분" },
        photo: photo("seongdong", "ttukseom-park", 325, 325, "The riverside plaza at Ttukseom", "뚝섬 한강변 광장"),
      },
    ],
  },
  {
    slug: "songpa",
    area: { en: "Jamsil and Seokchon", ko: "잠실·석촌" },
    title: { en: "Baekje's first capital, Seoul's tallest tower", ko: "백제의 첫 도읍과 가장 높은 빌딩" },
    intro: {
      en: "Two thousand years ago the Baekje kingdom built its first capital here. Its earthen walls and royal tombs are still in the ground, and Seoul's tallest building now rises over them.",
      ko: "2천 년 전 백제가 처음 도읍을 세운 곳이 송파입니다. 그때의 토성과 왕릉이 아직 남아 있고, 그 위로 지금은 서울에서 가장 높은 빌딩이 서 있습니다.",
    },
    length: { en: "About 10 hours", ko: "약 10시간" },
    start: { en: "Mongchontoseong Station, Line 8", ko: "8호선 몽촌토성역" },
    stops: [
      {
        time: "10:00",
        name: { en: "Mongchontoseong and the Hanseong Baekje Museum", ko: "몽촌토성과 한성백제박물관" },
        kind: { en: "History", ko: "역사" },
        body: {
          en: "Walk the grassy earthen wall of Baekje's capital inside Olympic Park, then see what was dug up here at the museum next to it.",
          ko: "올림픽공원 안, 풀로 덮인 백제의 토성을 걷고 바로 옆 박물관에서 이곳에서 나온 유물을 봅니다.",
        },
        tip: {
          en: "The permanent exhibition is free. The museum is closed on Mondays.",
          ko: "상설전시는 무료이고, 박물관은 월요일에 쉽니다.",
        },
      },
      {
        time: "12:30",
        name: { en: "Lotte World Mall", ko: "롯데월드몰" },
        kind: { en: "Lunch", ko: "점심" },
        body: {
          en: "Connected to Jamsil Station. Look around the mall and pick lunch from its many restaurants.",
          ko: "잠실역과 바로 이어집니다. 쇼핑몰을 둘러보고 안에 있는 여러 식당 중 한 곳에서 점심을 먹습니다.",
        },
        way: { en: "Line 8, 1 stop", ko: "8호선 1정거장" },
      },
      {
        time: "14:30",
        name: { en: "Seokchon Lake", ko: "석촌호수" },
        kind: { en: "Walk", ko: "산책" },
        body: {
          en: "A loop around the east and west lakes in front of the mall, about 2.5 km. In early April the whole shore is lined with cherry blossoms.",
          ko: "롯데월드몰 바로 앞, 동호와 서호를 가볍게 한 바퀴 걷습니다. 둘레는 약 2.5km이고, 4월 초에는 호숫가 전체가 벚꽃길이 됩니다.",
        },
        way: { en: "Walk 5 min", ko: "걸어서 5분" },
        photo: photo("songpa", "seokchon-lake", 367, 219, "Seokchon Lake from above in cherry blossom season", "벚꽃이 핀 석촌호수"),
      },
      {
        time: "15:30",
        name: { en: "Seokchon-dong Ancient Tombs", ko: "석촌동 고분군" },
        kind: { en: "History", ko: "역사" },
        body: {
          en: "Stone-mound tombs of early Baekje rulers, in a quiet park between apartment blocks. One of them is thought to belong to a 4th-century king.",
          ko: "아파트 사이 조용한 공원에 백제 초기 지배층의 돌무지무덤이 남아 있습니다. 그중 하나는 4세기 백제 왕의 무덤으로 추정됩니다.",
        },
        way: { en: "Walk 10 min from the lake's south side", ko: "호수 남쪽에서 걸어서 10분" },
      },
      {
        time: "16:30",
        name: { en: "Songnidan-gil", ko: "송리단길" },
        kind: { en: "Café", ko: "카페" },
        body: {
          en: "Small independent cafés fill the lanes between the tombs and the lake. Stop for tea.",
          ko: "고분과 호수 사이 골목에 작은 개인 카페들이 모여 있습니다. 예쁜 카페에서 차 한잔합니다.",
        },
        way: { en: "Walk 5 min", ko: "걸어서 5분" },
      },
      {
        time: "18:00",
        name: { en: "Seoul Sky, Lotte World Tower", ko: "롯데월드타워 서울스카이" },
        kind: { en: "Observatory", ko: "전망대" },
        body: {
          en: "On a clear day, go up the tower's observatory for the sunset and the city lights.",
          ko: "날씨가 맑다면 롯데월드타워 전망대에 올라 노을과 야경을 봅니다.",
        },
        tip: {
          en: "Sunset is around 5:20 pm in winter and 7:50 pm in summer, so adjust the time. Ticket prices vary; check the official site.",
          ko: "해 지는 시간이 겨울엔 오후 5시 20분, 여름엔 7시 50분 무렵이라 계절에 맞춰 시간을 옮기세요. 입장료는 공식 누리집에서 확인하세요.",
        },
        way: { en: "Walk 15 min", ko: "걸어서 15분" },
        photo: photo("songpa", "seoul-sky", 354, 263, "Night view of the Han River from Seoul Sky", "서울스카이에서 본 한강 야경"),
      },
      {
        time: "20:00",
        name: { en: "Bangi-dong food alley", ko: "방이동 먹자골목" },
        kind: { en: "Dinner", ko: "저녁" },
        body: {
          en: "Come down and end the day with Korean barbecue or a homestyle meal in Songpa's busiest food alley.",
          ko: "내려와서 방이동 먹자골목으로 옮겨 고기나 한식으로 저녁을 먹으며 하루를 마무리합니다.",
        },
        way: { en: "Walk 15 min", ko: "걸어서 15분" },
        photo: photo("songpa", "bangi-food-alley", 312, 417, "The gate of the Bangi-dong food alley at night", "밤의 방이동 먹자골목 입구"),
      },
    ],
  },
  {
    slug: "nowon",
    area: { en: "Buramsan and Gongneung", ko: "불암산·공릉" },
    title: { en: "A granite peak and a neighborhood night out", ko: "바위산과 동네 포차, 서울 사람들의 주말" },
    intro: {
      en: "Nowon is not on most visitors' maps. It is where Seoul lives: apartments, schools and local markets rather than offices. Easy granite peaks rise right behind it, and the evenings end under a street-stall tent.",
      ko: "노원은 외국인에게 잘 알려진 관광지는 아니지만, 사무실 대신 집과 학교, 동네 시장이 모인 서울의 대표적인 주거 지역입니다. 오르기 어렵지 않은 바위산이 바로 뒤에 있고, 저녁은 포장마차 천막 아래에서 끝납니다.",
    },
    length: { en: "About 9 hours", ko: "약 9시간" },
    start: { en: "Buramsan Station, Line 4 (formerly Danggogae)", ko: "4호선 불암산역 (옛 당고개역)" },
    stops: [
      {
        time: "09:30",
        name: { en: "Buramsan summit", ko: "불암산 정상" },
        kind: { en: "Hike", ko: "등산" },
        body: {
          en: "A 508 m peak on Seoul's northeastern edge. Its great granite top is said to look like the Buddha in a traditional hat, which gave the mountain its name. From the top, the whole city spreads out below.",
          ko: "서울 북동쪽 끝, 높이 508m의 산입니다. 커다란 바위 봉우리가 송낙을 쓴 부처님을 닮아 불암산이라는 이름이 붙었습니다. 정상에서는 서울 시내가 한눈에 내려다보입니다.",
        },
        tip: {
          en: "About 3 hours up and down. Wear shoes with grip; the top is bare rock.",
          ko: "오르내리는 데 3시간쯤 걸립니다. 정상 부근은 바위라 미끄럽지 않은 신발을 신으세요.",
        },
        photo: photo("nowon", "buramsan", 385, 256, "The city seen from Buramsan", "불암산에서 내려다본 서울"),
      },
      {
        time: "12:30",
        name: { en: "Geobuk Sanjang mountain hut", ko: "거북산장" },
        kind: { en: "Lunch", ko: "점심" },
        body: {
          en: "A hut halfway up the mountain where hikers rest and eat. Try a hot pajeon and a bowl of something warm.",
          ko: "불암산 중턱, 등산객이 쉬어 가며 밥을 먹는 산장입니다. 따끈한 파전과 국물 한 그릇을 먹습니다.",
        },
        tip: {
          en: "Mountain huts can close in bad weather. Bring water and a snack.",
          ko: "산장은 날씨에 따라 문을 닫기도 하니 물과 간식을 챙기세요.",
        },
        photo: photo("nowon", "turtle-lodge", 297, 240, "Pajeon and a warm bowl at the hut", "산장의 파전과 국물"),
      },
      {
        time: "13:30",
        name: { en: "Hakdoam Hermitage", ko: "학도암" },
        kind: { en: "Temple", ko: "사찰" },
        body: {
          en: "A small hermitage on the mountain's west slope. Behind its hall, a 13.4 m Bodhisattva carved into the cliff in the 1870s looks out over the city; tradition says Empress Myeongseong had it made.",
          ko: "불암산 서쪽 자락의 작은 암자입니다. 대웅전 뒤 절벽에 1870년대에 새긴 높이 13.4m의 마애관음보살좌상이 도시를 내려다봅니다. 명성황후가 발원했다고 전해집니다.",
        },
        way: { en: "Walk down 30 min", ko: "걸어서 내려가 30분" },
      },
      {
        time: "15:30",
        name: { en: "Gyeongchun Line Forest Trail", ko: "경춘선숲길" },
        kind: { en: "Walk", ko: "산책" },
        body: {
          en: "The old Gyeongchun railway, closed in 2010, is now a tree-lined path of more than 6 km through Gongneung-dong. The rails are still under your feet. Stop for a snack at Gongneung-dong Dokkaebi Market on the way.",
          ko: "2010년에 멈춘 옛 경춘선 철길이 공릉동을 지나는 6km 넘는 숲길이 되었습니다. 발밑에는 아직 레일이 남아 있습니다. 가는 길에 공릉동 도깨비시장에 들러 간식도 먹어 보세요.",
        },
        way: { en: "Bus or taxi to Gongneung Station, 15 min", ko: "버스나 택시로 공릉역까지 15분" },
      },
      {
        time: "17:30",
        name: { en: "Seokgye Station street stalls", ko: "석계역 포장마차 거리" },
        kind: { en: "Dinner", ko: "저녁" },
        body: {
          en: "Outside Seokgye Station, a row of pojangmacha tents serves tteokbokki, fish cakes and drinking snacks. A very Korean way to end the day outdoors.",
          ko: "석계역 출구 앞 포장마차 천막 아래에서 분식과 안주를 즐깁니다. 한국 특유의 야외 밤 문화를 가까이서 볼 수 있습니다.",
        },
        tip: {
          en: "Seokgye is a transfer station for Lines 1 and 6, so getting back to your hotel is easy.",
          ko: "1·6호선 환승역이라 일정이 끝난 뒤 시내나 숙소로 돌아가기 편합니다.",
        },
        way: { en: "From the trail's west end at Kwangwoon Univ. Station, Line 1, 1 stop", ko: "숲길 서쪽 끝 광운대역에서 1호선 1정거장" },
        photo: photo("nowon", "seokgye-pojangmacha", 224, 253, "Street-stall tents outside Seokgye Station", "석계역 앞 포장마차"),
      },
    ],
    nearby: {
      en: "Bulamsa, the Silla-era temple below the summit's east face, is across the city line in Namyangju, Gyeonggi-do. Go down that side instead if you want to see it.",
      ko: "정상 동쪽 암벽 아래의 신라 고찰 불암사는 서울 경계 너머 경기도 남양주시에 있습니다. 들르고 싶다면 그쪽으로 내려가세요.",
    },
  },
  {
    slug: "dongdaemun",
    area: { en: "Jegi-dong and Hoegi", ko: "제기동·회기" },
    title: { en: "Herb markets and a 1960s theater", ko: "약재 향 가득한 시장과 옛 극장" },
    intro: {
      en: "Korea's largest herbal medicine market is here, along with one of Seoul's biggest farmers' markets. You will see Seoul shopping for real, a 1960s theater turned café, and a pajeon alley by a university.",
      ko: "한국에서 가장 큰 약재 시장과 서울의 큰 농수산물 시장이 이곳에 있습니다. 가공되지 않은 서울의 장보기 풍경과 1960년대 극장을 고친 카페, 대학가 파전 골목까지 이어집니다.",
    },
    length: { en: "About 9 hours", ko: "약 9시간" },
    start: { en: "Jegi-dong Station, Line 1", ko: "1호선 제기동역" },
    stops: [
      {
        time: "10:00",
        name: { en: "Seoul Yangnyeongsi Herb Medicine Museum", ko: "서울약령시 한의약박물관" },
        kind: { en: "Museum", ko: "박물관" },
        body: {
          en: "A small museum on traditional Korean medicine, a good primer before the market. Adults 1,000 won.",
          ko: "한국 전통 의학을 소개하는 작은 박물관으로, 시장에 들어가기 전에 보면 좋습니다. 어른 1,000원.",
        },
        tip: {
          en: "Open 10:00 to 18:00 (to 17:00 from November to February). Closed on New Year's Day, Seollal and Chuseok.",
          ko: "10시부터 18시까지(11~2월은 17시까지). 1월 1일과 설·추석에 쉽니다.",
        },
      },
      {
        time: "10:45",
        name: { en: "Gyeongdong Market and the herb alleys", ko: "경동시장과 약령시 골목" },
        kind: { en: "Market", ko: "시장" },
        body: {
          en: "Ginseng, dried roots and medicinal herbs fill the alleys with their scent, next to stalls of fruit, fish and grain. Real everyday Seoul, with nothing staged for visitors.",
          ko: "인삼과 약초 향이 골목마다 퍼지고, 그 옆으로 과일과 생선, 곡식 가게가 이어집니다. 꾸미지 않은 서울의 일상을 볼 수 있습니다.",
        },
        tip: { en: "Mornings are liveliest.", ko: "오전이 가장 활기찹니다." },
        way: { en: "Walk 3 min", ko: "걸어서 3분" },
        photo: photo("dongdaemun", "gyeongdong-market", 476, 552, "The covered arcade of Gyeongdong Market", "경동시장의 지붕 덮인 골목"),
      },
      {
        time: "12:30",
        name: { en: "Yongdu-dong jjukkumi alley", ko: "용두동 쭈꾸미 골목" },
        kind: { en: "Lunch", ko: "점심" },
        body: {
          en: "Fiery stir-fried baby octopus, finished with fried rice in the same pan. Najeongsun Halmae Jjukkumi is the long-time favorite.",
          ko: "매콤한 쭈꾸미볶음을 먹고 같은 판에 밥을 볶아 마무리합니다. 나정순할매쭈꾸미가 오래된 단골집입니다.",
        },
        tip: { en: "It is very spicy. Ask for a milder level.", ko: "꽤 맵습니다. 덜 맵게 해 달라고 하세요." },
        way: { en: "Walk 15 min", ko: "걸어서 15분" },
      },
      {
        time: "14:30",
        name: { en: "Starbucks Gyeongdong 1960", ko: "스타벅스 경동1960" },
        kind: { en: "Café", ko: "카페" },
        body: {
          en: "Coffee inside Gyeongdong Theater, built in 1960. The tiered seats and high ceiling remain, and your order name appears on the old screen.",
          ko: "1960년에 지은 경동극장을 고친 카페입니다. 계단식 객석과 높은 천장이 그대로 남아 있고, 주문하면 옛 영사 스크린에 닉네임이 뜹니다.",
        },
        tip: {
          en: "On the 3rd floor of the market's main building.",
          ko: "경동시장 본관 3층에 있습니다.",
        },
        way: { en: "Walk 15 min", ko: "걸어서 15분" },
        photo: photo("dongdaemun", "starbucks-1960", 664, 498, "Inside the café in the old Gyeongdong Theater", "옛 경동극장을 고친 카페 내부"),
      },
      {
        time: "18:00",
        name: { en: "Hoegi pajeon alley", ko: "회기역 파전골목" },
        kind: { en: "Dinner", ko: "저녁" },
        body: {
          en: "Outside Hoegi Station near Kyung Hee University, small shops fry big seafood pajeon to go with makgeolli.",
          ko: "경희대 앞 회기역 1번 출구 골목에서 큼직한 해물파전에 막걸리 한잔으로 하루를 마칩니다.",
        },
        tip: {
          en: "Friday to Sunday, 6 to 11 pm, try the 1960 Gyeongdong Night Market instead.",
          ko: "금~일요일 저녁(18~23시)이라면 1960 경동야시장도 좋습니다.",
        },
        way: { en: "Line 1, 2 stops", ko: "1호선 2정거장" },
      },
    ],
    nearby: {
      en: "Dongdaemun Gate and Dongdaemun Market are not in Dongdaemun-gu: they are in Jongno-gu and Jung-gu. The grilled-fish alley by the gate (Jongno 5-ga) and Sindang-dong's tteokbokki town (Jung-gu) are a short ride away.",
      ko: "이름과 달리 동대문(흥인지문)과 동대문시장은 동대문구가 아니라 종로구·중구에 있습니다. 그 근처의 동대문 생선구이골목(종로5가)과 신당동 떡볶이타운(중구)도 가까우니 함께 들러 보세요.",
    },
  },
];

export const courseFor = (slug: string) => COURSES.find((c) => c.slug === slug);
