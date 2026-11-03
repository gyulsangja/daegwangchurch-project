import type {ReactNode} from 'react';
import {Users,House,Network,CalendarDays,BookOpen,HeartHandshake,HandHeart,ClipboardList,GraduationCap,Images,Church,Settings,ShieldCheck,Inbox,ChartNoAxesCombined,LayoutDashboard,FileText} from 'lucide-react';

const icons={members:Users,families:House,organizations:Network,calendar:CalendarDays,worship:BookOpen,care:HeartHandshake,prayer:HandHeart,plans:ClipboardList,education:GraduationCap,albums:Images,church:Church,settings:Settings,access:ShieldCheck,intake:Inbox,statistics:ChartNoAxesCombined,home:LayoutDashboard,pages:FileText};
export function ListHeading({icon,children}:{icon:keyof typeof icons;children:ReactNode}){
 const Icon=icons[icon];
 return <header className="page-heading list-heading"><span className="list-heading-icon" aria-hidden="true"><Icon size={25} strokeWidth={1.7}/></span>{children}</header>;
}
