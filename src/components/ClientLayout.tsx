import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const ClientLayout = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] font-body font-normal text-foreground selection:bg-primary selection:text-primary-foreground">
      <main className="relative z-10 mx-auto min-w-0 max-w-lg px-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(2rem,env(safe-area-inset-top,0px))] md:max-w-4xl md:px-[max(2.5rem,env(safe-area-inset-left,0px))] md:pr-[max(2.5rem,env(safe-area-inset-right,0px))] md:pt-[max(3rem,env(safe-area-inset-top,0px))]">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default ClientLayout;
