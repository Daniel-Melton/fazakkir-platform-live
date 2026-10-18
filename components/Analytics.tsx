import Script from "next/script";

// Google Consent Mode v2: every storage type starts as "denied" unless the visitor already accepted.
// GTM and the Google tags inside it then respect the visitor's choice.
const CONSENT_DEFAULT = `
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
var s=null;try{s=localStorage.getItem('fz_consent')}catch(e){}
var v=s==='granted'?'granted':'denied';
gtag('consent','default',{ad_storage:v,analytics_storage:v,ad_user_data:v,ad_personalization:v,wait_for_update:500});
`;

// Loads Google Tag Manager only when NEXT_PUBLIC_GTM_ID is set.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GTM_ID;
  if (!id) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
      </Script>
    </>
  );
}
