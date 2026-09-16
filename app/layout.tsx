import './globals.css';import {Providers} from './providers';
export const metadata={title:'NASTIA BEAUTY | جمال مختار بعناية',description:'واجهة تجريبية لمتجر NASTIA BEAUTY العراقي'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body><Providers>{children}</Providers></body></html>}
