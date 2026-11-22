# 성향 테스트 초안: 12문항, 4개 축, 12개 구

코드: `src/lib/match/` (문항 `questions.ts`, 구 성향값 `districts.ts`, 16개 유형 `travel-types.ts`, 채점 `match.ts`). 이 문서는 검토용 요약이며, 값을 바꿀 때는 코드 파일을 고치고 `npm test`로 분포를 다시 확인한다.

## 4개 축

| 축 | 음(-) 쪽 | 양(+) 쪽 |
|---|---|---|
| 시간의 결 `time` | **H** Heritage: 노포, 손으로 만든 것 | **T** Trend: 새로 생긴 것, 디자인 |
| 무대 `stage` | **A** Alley: 골목, 시장 | **O** Open: 산, 강, 공원 |
| 분위기 `mood` | **C** Calm: 조용히 관찰 | **B** Buzz: 북적임, 밤 |
| 속도 `pace` | **L** Linger: 한 곳에 오래 | **F** Flow: 여러 곳을 빠르게 |

## 12문항

사이트에는 영어로 나가고, 한국어 토글에서 아래 번역을 쓴다. "점수"는 그 선택지를 골랐을 때 기우는 쪽이다.

| # | 문항 | A | B | 점수 |
|---|---|---|---|---|
| 1 | Your first morning in Seoul? (서울에서의 첫 아침은?) | A quiet alley with an old tea house (오래된 찻집이 있는 조용한 골목) | A riverside run at sunrise (해 뜰 무렵 강변 달리기) | A 골목 / B 탁 트인 곳 |
| 2 | Lunch is... (점심은...) | Pointing at whatever the market grandma is cooking (시장 할머니가 만들고 있는 걸 가리켜 주문) | The new place everyone has been posting about (요즘 다들 올리는 새 가게) | A 노포 / B 트렌드, 약간 북적임. **음식 조건**: A 모험형, B 편한 식당 |
| 3 | You find a workshop where someone is making things by hand. (손으로 물건을 만드는 공방을 발견했다) | Stay and watch for an hour (한 시간쯤 앉아 구경) | Take a photo and head to the next spot (사진 한 장 찍고 다음 장소로) | A 오래 머묾 / B 빠르게. 속도 축 동점 결정 문항 |
| 4 | Pick a Saturday night. (토요일 밤을 고른다면) | A packed alley bar with plastic stools and strangers' toasts (플라스틱 의자에서 낯선 사람과 건배하는 골목 술집) | A quiet rooftop or a long walk by the river (조용한 루프탑이나 강변 산책) | A 북적임 / B 조용함, 약간 탁 트인 곳. 분위기 축 동점 결정 문항 |
| 5 | At the end of the day, your camera roll is mostly... (하루가 끝났을 때 사진첩에는 주로) | Old signs, wooden doors and handwritten menus (오래된 간판, 나무 문, 손글씨 메뉴판) | Design shops, murals and new buildings (디자인 숍, 벽화, 새 건물) | A 노포 / B 트렌드. 시간 축 동점 결정 문항 |
| 6 | Getting around, you would rather... (이동할 때는) | Walk everywhere, even if it takes longer (오래 걸려도 걸어서) | Hop on the subway and cover more ground (지하철로 더 많은 곳을) | A 오래 머묾 / B 빠르게. **이동 조건**: A 걷기, B 지하철 |
| 7 | A free afternoon. Where do you end up? (자유로운 오후, 어디에 있을까) | On a mountain trail above the city (도시가 내려다보이는 산길) | Lost inside a covered market (지붕 덮인 시장 안에서 길 잃기) | A 탁 트인 곳 / B 골목. 무대 축 동점 결정 문항 |
| 8 | Crowds make you feel... (사람이 많으면) | Alive. The more the better (신난다, 많을수록 좋다) | Tired. You would rather find the quiet corner (지친다, 조용한 구석을 찾는다) | A 북적임 / B 조용함 |
| 9 | Which souvenir comes home with you? (기념품은) | A brass spoon from a shop that has been open for 60 years (60년 된 가게의 놋숟가락) | A limited print from a young local designer (젊은 동네 디자이너의 한정판 프린트) | A 노포 / B 트렌드 |
| 10 | How do you like your day planned? (하루 계획은) | Two or three places, no rush (두세 곳, 여유롭게) | As many as you can fit. You can sleep on the plane (최대한 많이, 잠은 비행기에서) | A 오래 머묾 / B 빠르게, 약간 북적임 |
| 11 | The view from your café window? (카페 창밖으로 보고 싶은 풍경은?) | A narrow alley with potted plants and laundry lines (화분과 빨래줄이 있는 좁은 골목) | A wide river or a mountain ridge (넓은 강이나 산 능선) | A 골목 / B 탁 트인 곳 |
| 12 | It rains on your trip day. You... (여행 날 비가 온다면) | Find one old tea house and stay all afternoon (오래된 찻집 한 곳에서 오후 내내) | Dash between a few new indoor spots (새로 생긴 실내 명소 몇 곳을 돌아다님) | A 오래 머묾, 약간 노포 / B 빠르게, 약간 트렌드 |

축별 가중치 합: 시간 3.5, 무대 3.5, 분위기 3, 속도 4 (문항 수: 시간 4, 무대 4, 분위기 4, 속도 4). 축 점수는 문항 수로 나눠 -2~+2로 맞추므로 문항을 추가해도 기준이 바뀌지 않는다.

## 12개 구 성향값 (-2 ~ +2)

| 구 | 시간 (H-/T+) | 무대 (A-/O+) | 분위기 (C-/B+) | 속도 (L-/F+) | 성격 |
|---|---|---|---|---|---|
| 종로구 | -1.6 | -1.0 | -0.8 | -1.2 | 한옥 골목과 공방, 오래 머무는 동네 |
| 중구 | -1.0 | -1.4 | +1.4 | +0.8 | 인쇄 골목과 노포, 밤의 을지로 |
| 동대문구 | -1.6 | -1.2 | +0.8 | -0.6 | 약령시장과 청과시장, 시장의 생활 |
| 서대문구 | -0.8 | +0.8 | -1.2 | -0.6 | 산자락길과 오래된 시장, 근대의 기억 |
| 노원구 | -0.4 | +1.6 | -1.4 | -1.2 | 폐선 철길 숲길과 산, 동네 생활 |
| 송파구 | -1.0 | +1.2 | -0.4 | +0.8 | 백제 토성과 넓은 공원 |
| 용산구 | +0.8 | -0.6 | +1.4 | +1.0 | 언덕 골목과 여러 나라의 식탁 |
| 마포구 | +1.0 | -0.8 | +0.8 | -1.0 | 동네 시장과 인디 문화, 한강 |
| 성동구 | +1.6 | -1.0 | -0.4 | +0.8 | 수제화 공방과 공장을 바꾼 공간 |
| 영등포구 | +0.6 | -1.2 | -0.2 | -0.4 | 철공소 골목의 예술, 동포 거리 |
| 관악구 | +0.6 | +1.4 | +1.2 | +1.0 | 산과 대학가, 값싸고 활기찬 먹거리 |
| 강남구 | +1.6 | +0.6 | -0.6 | +1.4 | 도심 속 왕릉과 하천 산책, 세련된 서울 |

## 16개 여행 유형

| 코드 | 이름 | 한국어 | 가장 많이 매칭되는 구 |
|---|---|---|---|
| HACL | The Alley Scholar | 골목의 학자 | 종로구 54%, 서대문구 23% |
| HACF | The Old-Sign Collector | 옛 간판 수집가 | 송파구 35%, 종로구 17%, 서대문구 17% |
| HABL | The Market Regular | 시장 단골 | 동대문구 56%, 중구 16% |
| HABF | The Night-Market Runner | 야시장 질주자 | 중구 75%, 동대문구 17% |
| HOCL | The Wall Walker | 성곽 산책자 | 서대문구 58%, 노원구 26% |
| HOCF | The Ridge Rambler | 능선 순례자 | 송파구 72%, 서대문구 25% |
| HOBL | The Pavilion Host | 정자의 주인장 | 동대문구 33%, 송파구 25% |
| HOBF | The Lantern Chaser | 등불 추적자 | 송파구 47%, 관악구 22% |
| TACL | The Studio Dweller | 작업실 거주자 | 영등포구 68% |
| TACF | The Workshop Hopper | 공방 순례자 | 성동구 56%, 영등포구 32% |
| TABL | The Indie Regular | 동네 인디 단골 | 마포구 58%, 영등포구 25% |
| TABF | The Rooftop Hopper | 루프탑 호퍼 | 용산구 57%, 성동구 19% |
| TOCL | The River Reader | 강변의 독서가 | 노원구 55%, 강남구 16% |
| TOCF | The City Cyclist | 도시 자전거꾼 | 강남구 63% |
| TOBL | The Riverside Host | 강변 피크닉 호스트 | 마포구 50%, 관악구 25% |
| TOBF | The River Runner | 강변 러너 | 용산구 41%, 관악구 34% |

같은 유형이라도 각 축이 얼마나 강한지에 따라 구가 달라질 수 있다. 결과 화면은 유형과 구를 따로 보여주고, 구는 4개 축 점수와 가장 가까운 곳으로 고른다.

## 검증 결과

12문항의 가능한 답 조합 4,096가지를 모두 계산했을 때 1순위로 나오는 구의 비율:

송파구 12.7%, 영등포구 12.2%, 서대문구 11.8%, 용산구 10.6%, 마포구 9.4%, 동대문구 6.9%, 관악구 6.8%, 중구 6.6%, 노원구 6.0%, 종로구 5.9%, 강남구 5.9%, 성동구 5.0%

- 12개 구가 모두 나오고, 어느 구도 16%를 넘지 않는다(균등하면 8.3%). 10문항일 때(5.3~14.1%)보다 고르다. 이 기준은 `npm test`가 매번 확인한다
- 다듬을 점: 문항이 늘면서 한 축에 약하게 기운 사람이 많아져, 유형과 구가 어긋나는 경우가 생겼다. 예를 들어 HACF(골목형)의 35%가 송파구(탁 트인 곳)로 간다. 장소 조사 뒤 구 성향값을 다듬을 때, 유형 글자와 구 성향이 3글자 이상 일치하는 비율을 함께 테스트로 확인하며 조정한다
- 참고: 실제 사용자는 답을 고르게 고르지 않으므로, 발표 전 지인 테스트로 한 번 더 확인하면 좋다
