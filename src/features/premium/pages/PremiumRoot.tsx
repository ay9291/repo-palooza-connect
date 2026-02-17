import { Outlet } from "react-router-dom";
import { EcommerceProvider } from "@/features/premium/state/EcommerceContext";

const PremiumRoot = () => (
  <EcommerceProvider>
    <Outlet />
  </EcommerceProvider>
);

export default PremiumRoot;
