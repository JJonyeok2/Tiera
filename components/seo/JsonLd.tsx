/* ---------------------------------------------------------------------------
 * Header: 구조화 데이터(JSON-LD).
 *
 * 검색 결과에 별점·순위가 붙으려면 크롤러가 읽을 수 있는 형태로 한 번 더
 * 선언해줘야 한다. HTML에 별을 그리는 것만으로는 인식되지 않는다.
 *
 * 원칙: 화면에 없는 값은 넣지 않는다. 특히 aggregateRating은 실제 리뷰가
 * 1건 이상일 때만 내보낸다. 리뷰가 0건인데 별점을 선언하면 구조화 데이터
 * 스팸이고, 적발되면 리치 결과에서 통째로 배제된다.
 * ------------------------------------------------------------------------- */

export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // 값은 전부 우리 DB에서 온 것이고 JSON.stringify로 이스케이프된다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
/* Footer: components/seo/JsonLd.tsx */
