import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  totalAmount: number;
  shippingAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      orderNumber,
      orderId,
      totalAmount,
      shippingAddress,
      items,
    }: OrderEmailRequest = await req.json();

    console.log("Sending order confirmation email to:", customerEmail);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const emailPayload = {
      from: "MS Furnitures <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Order Confirmation - ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 18px; margin-bottom: 10px;">Hello ${customerName},</p>
              <p style="margin-bottom: 20px;">Thank you for your order! We've received your order and will process it shortly.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h2 style="margin-top: 0; color: #667eea;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order Number:</strong> <span style="font-size: 24px; color: #667eea; font-weight: bold;">${orderNumber}</span></p>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString()}</p>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Items Ordered</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
                      <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea; border-top: 2px solid #ddd;">₹${totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Shipping Address</h3>
                <p style="margin: 5px 0; white-space: pre-line;">${shippingAddress}</p>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📞 Need Help?</strong></p>
                <p style="margin: 5px 0;">Contact us at MS Furnitures for any queries about your order.</p>
              </div>

              <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                Thank you for choosing MS Furnitures!<br>
                Premium Engineering Wood Furniture
              </p>
            </div>
          </body>
        </html>
      `,
    };

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${emailResponse.status} ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
