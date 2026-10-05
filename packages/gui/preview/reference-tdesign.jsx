import React from 'react';
import {Card,Link,Dropdown,Button,Select,DatePicker,Radio,Checkbox,Switch,DialogCard,Popup,Popconfirm,Tooltip,Message,Alert,Steps,Rate,Tag,List,Progress,Calendar,Tabs,Pagination,Timeline,Avatar,Badge,Slider} from 'tdesign-react';
import 'tdesign-react/es/style/index.css';
import {HelpCircleIcon,FileIcon,ArrowUpIcon,ChatIcon,CloseIcon} from 'tdesign-icons-react';
import {TourContent,TourPreview} from './reference-content.jsx';
import {ReferenceCanvas,listItems,Missing} from './reference-layout.jsx';
const states=[{label:'Option A'},{label:'Option B',checked:true},{label:'Option C',checked:true},{label:'Option D',disabled:true},{label:'Option E',disabled:true,checked:true}];
const mini=<TourPreview rows={<List split>{listItems.map(item=><List.ListItem key={item.id}>{item.title}<Tag theme="primary">In Progress</Tag></List.ListItem>)}</List>}/>;
const tour=(accent=false)=><Card bordered={false}><TourContent accent={accent} preview={mini} link={<Link theme="primary">Help info ↗</Link>} button={<><Button size="small" variant="outline">Previous</Button><Button size="small" theme="primary">Next</Button></>}/></Card>;
const options=[{label:'Option A',value:'a'},{label:'Option B',value:'b'}];
const line=(percentage,theme)=> <Progress percentage={percentage} theme={theme}/>;
export default function Overview(){return <ReferenceCanvas system="tdesign" slots={{
 buttons:<><Button theme="primary">Primary Button</Button><Button variant="outline">Default Button</Button><Button theme="danger" variant="outline">Danger Button</Button></>,
 select:<Select defaultValue="a" options={options} style={{width:230}}/>,date:<DatePicker defaultValue="2022-11-18" style={{width:220}}/>,
 radios:states.map(({label,checked,disabled},i)=><Radio key={label} checked={i===2||i===4} disabled={disabled}>{label}</Radio>),
 checkboxes:states.map(({label,checked,disabled},i)=><Checkbox key={label} checked={i===2||i===4} disabled={disabled}>{label}</Checkbox>),
 switches:<div className="ref-stack">{[false,true].map((withText,i)=><div className="ref-row" key={i}>{[true,false,true,false].map((checked,j)=><Switch key={j} value={checked} disabled={j>1} label={withText?['✓','×']:undefined}/>)}</div>)}</div>,
 modal:<DialogCard header="Basic Modal" body="You can use Modal to create a new floating layer over the current page to get user feedback." cancelBtn="Cancel" confirmBtn="OK"/>,
 popover:<Popup visible placement="bottom-left" attach={()=>document.getElementById('reference-popover')} content={<><strong>Popover Title</strong><p>The floating card popped by clicking.</p></>}><span> </span></Popup>,
 popconfirm:<Popconfirm visible attach={()=>document.getElementById('reference-popconfirm')} content="Popconfirm" confirmBtn="OK" cancelBtn="Cancel"><span> </span></Popconfirm>,
 tooltip:<Tooltip visible content="Prompt Text" attach={()=>document.getElementById('reference-tooltip')}><span> </span></Tooltip>,
 message:<Message theme="success">This is a normal message</Message>,
 steps:<Steps current={1}><Steps.StepItem title="Finished"/><Steps.StepItem title="In Progress"/><Steps.StepItem title="Waiting"/></Steps>,rating:<Rate value={3.5} allowHalf/>,
 tags:<><Tag>Tag</Tag><Tag variant="outline">+ Tag</Tag>{['success','primary','warning','danger'].map((theme,i)=><Tag key={theme} theme={theme} variant="light">{['Green','Blue','Gold','Red'][i]}</Tag>)}</>,alert:<Alert theme="success" message="Success Text" close/>,
 list:<List split>{listItems.map(item=><List.ListItem key={item.id}><div><div className="reference-list-title">{item.title}</div><div className="reference-list-description">{item.description}</div></div><div className="reference-mini-steps">{['Step1','Step2','Step3'].map(x=><span key={x}><i/>{x}</span>)}</div></List.ListItem>)}</List>,
 progress:<div className="ref-stack">{line(50,'default')}{<Progress percentage={100} status="success"/>}{<Progress percentage={70} status="error"/>}<div className="ref-row"><Progress theme="circle" percentage={68}/><Progress theme="circle" percentage={100} status="success"/><Progress theme="circle" percentage={100} status="error"/></div><div className="ref-row"><Badge color="blue">In Progress</Badge><Badge color="green">Success</Badge><Badge color="red">Failed</Badge></div></div>,
 tour:tour(),tourAccent:tour(true),
 calendar:<Calendar theme="card" value={new Date(2022,11,19)} mode="month"/>,
 tabs:<div className="ref-row"><Tabs defaultValue="1"><Tabs.TabPanel value="1" label="Tab1"/><Tabs.TabPanel value="2" label="Tab2"/><Tabs.TabPanel value="3" label="Tab3" disabled/></Tabs><Tabs defaultValue="1"><Tabs.TabPanel value="1" label="◇ Tab1"/><Tabs.TabPanel value="2" label="◇ Tab2"/><Tabs.TabPanel value="3" label="◇ Tab3" disabled/></Tabs><Dropdown options={[{content:"Option A",value:"a"}]}><Button theme="primary">Dropdown ⌄</Button></Dropdown></div>,
 pagination:<Pagination total={50} defaultCurrent={2} defaultPageSize={10} showPageSize={false}/>,
 timeline:<Timeline>{[1,2,3,4].map(i=><Timeline.Item key={i}>Create a services site 2015-09-01</Timeline.Item>)}</Timeline>,
 avatars:<>{[false,true].map(square=>[0,1,2].map(i=><Avatar key={`${square}-${i}`} shape={square?'round':'circle'}>{i===1?'U':'A'}</Avatar>))}</>,
 sliders:<div className="ref-row"><Slider value={40}/><Slider value={70} tooltipProps={{visible:true}}/></div>,
 badges:<><Badge dot color="green">Success</Badge><Badge dot color="red">Error</Badge><Badge count={5}/><Badge dot/></>,
 floating:<div className="ref-grid">{[HelpCircleIcon,FileIcon,FileIcon,FileIcon,ArrowUpIcon,ChatIcon,ArrowUpIcon,FileIcon,CloseIcon].map((Icon,i)=><Button key={i} shape="circle" theme={i===8?'primary':'default'} icon={<Icon/>}/>)}</div>
}}/>;}
