# API / Function Documentation

## Supabase Edge Functions

### POST /functions/v1/create-showroom
Creates showroom users and showroom records.

Required caller:
- Authenticated admin (validated through `has_role(..., 'admin')`)

Payload:
- `email`, `password`, `business_name`, `contact_person`, `phone`, `address`, `city`, `state`
- optional: `gst_number`, `notes`

### POST /functions/v1/send-order-email
Sends order confirmation email.

Required caller:
- Authenticated user with one of:
  - owner of `orderId`
  - admin role

Payload:
- `customerEmail`, `customerName`, `orderNumber`, `orderId`, `totalAmount`, `shippingAddress`, `items[]`

Security notes:
- Requires Authorization bearer token.
- Verifies order exists and access is authorized.
