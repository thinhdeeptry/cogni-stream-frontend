import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "cognistream - Nền tảng học trực tuyến hàng đầu Việt Nam";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(to right, #FFA500, #FF4500)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter",
          color: "white",
          padding: "0 120px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            cognistream
          </div>
        </div>
        <div
          style={{
            fontSize: 36,
            marginBottom: 40,
            maxWidth: 800,
            lineHeight: 1.4,
            fontWeight: "bold",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          Nền tảng học trực tuyến hàng đầu Việt Nam
        </div>
        <div
          style={{
            fontSize: 24,
            opacity: 0.9,
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Hàng nghìn khóa học chất lượng cao về lập trình, thiết kế và nhiều
          lĩnh vực khác
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
