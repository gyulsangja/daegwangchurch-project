import {ActivityIndicator,View,Text} from 'react-native';
import {colors,styles} from './ui';
export function DataLoading({label='데이터를 불러오는 중',compact=false}:{label?:string;compact?:boolean}){
 return <View accessibilityRole="progressbar" accessibilityLabel={label} style={{gap:12,paddingVertical:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}><ActivityIndicator color={colors.primary}/><Text style={styles.caption}>{label}</Text></View>
  {!compact&&<View accessible={false} importantForAccessibility="no-hide-descendants" style={{gap:12,padding:16,borderRadius:12,backgroundColor:colors.surface}}>{[90,65,80].map((width,i)=><View key={i} style={{width:`${width}%`,height:i===0?22:14,borderRadius:5,backgroundColor:colors.line}}/>)}</View>}
 </View>;
}
