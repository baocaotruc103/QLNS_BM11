import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json()

    if (!imageBase64) {
      throw new Error("Missing imageBase64 payload")
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in Edge Function secrets")
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`
    
    const prompt = `Bạn là một trợ lý ảo chuyên trích xuất thông tin từ giấy tờ, form biểu mẫu hoặc ảnh chụp hồ sơ. 
Dựa vào hình ảnh được cung cấp, hãy trích xuất các thông tin sau và trả về định dạng JSON thuần túy (không kèm markdown \`\`\`json).
Chỉ trích xuất những thông tin có thể đọc được. Nếu không có, hãy để null hoặc chuỗi rỗng.
LƯU Ý QUAN TRỌNG VỀ ĐỊNH DẠNG NGÀY THÁNG:
- Các trường yêu cầu ngày tháng năm phải có định dạng DD/MM/YYYY (ví dụ: 02/10/1995).
- Các trường yêu cầu tháng năm phải có định dạng MM/YYYY (ví dụ: 09/2013).

Định dạng JSON yêu cầu các key sau:
- ho_va_ten_khai_sinh (string)
- ngay_thang_nam_sinh (định dạng DD/MM/YYYY)
- don_vi (string)
- gioi_tinh (string, ví dụ: "Nam", "Nữ")
- thang_nam_vao_quan_doi (định dạng MM/YYYY)
- thang_nam_ve_khoa_cong_tac (định dạng MM/YYYY)
- so_cmtqd (string, lấy từ Số CM QNCN, Số CMTQĐ, Số chứng minh sĩ quan, v.v...)
- ngay_cap_cmtqd (định dạng DD/MM/YYYY)
- noi_cap_cmtqd (string)
- cap_bac (string)
- chuc_vu (string)
- dan_toc (string, nếu có thêm (Việt) thì bỏ qua, ví dụ Kinh (Việt) -> Kinh)
- ton_giao (string)
- que_quan (string, giữ nguyên chuỗi địa chỉ quê quán)
- que_quan_chi_tiet (string)
- nhom_mau (string)
- so_cccd (string)
- ngay_cap_cccd (định dạng DD/MM/YYYY)
- noi_cap_cccd (string)
- so_the_bhyt (string)
- noi_dang_ky_kcb (string)
`

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    })

    const geminiData = await response.json()

    if (geminiData.error) {
      throw new Error(`Gemini Error: ${geminiData.error.message}`)
    }

    const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textOutput) {
      throw new Error("No response generated from Gemini")
    }

    let parsedData = {}
    try {
      parsedData = JSON.parse(textOutput)
    } catch (e) {
      console.error("Could not parse JSON from Gemini:", textOutput)
      throw new Error("Response was not a valid JSON")
    }

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
