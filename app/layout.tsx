import './globals.css';import {Providers} from './providers';
export const metadata={title:'Nastia Beauty | جمال مختار بعناية',description:'متجر Nastia Beauty العراقي'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body><Providers>{children}</Providers></body></html>}
