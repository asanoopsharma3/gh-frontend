import Footer from "../component/Footer";
import FAQSection from "./FAQSection";
import SupportComponent from "./SupportComponent";
import SupportContact from "./SupportContact";

export default function Support(){
    return(
        <>

        <SupportComponent/>
        <SupportContact/>
     
       
      {/* Mobile-only spacer */}
<div className="h-[150px] block md:hidden"></div>


        </>
    );
}