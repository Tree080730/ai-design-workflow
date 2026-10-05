import React,{useState} from 'react';
import Button from '@cloudscape-design/components/button';
import Select from '@cloudscape-design/components/select';
import DatePicker from '@cloudscape-design/components/date-picker';
import Calendar from '@cloudscape-design/components/calendar';
import RadioGroup from '@cloudscape-design/components/radio-group';
import Checkbox from '@cloudscape-design/components/checkbox';
import Toggle from '@cloudscape-design/components/toggle';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Alert from '@cloudscape-design/components/alert';
import Steps from '@cloudscape-design/components/steps';
import Badge from '@cloudscape-design/components/badge';
import Table from '@cloudscape-design/components/table';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import Tabs from '@cloudscape-design/components/tabs';
import Pagination from '@cloudscape-design/components/pagination';
import Slider from '@cloudscape-design/components/slider';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Link from '@cloudscape-design/components/link';
import '@cloudscape-design/global-styles/index.css';
import {RingExamples} from './reference-fallbacks.jsx';
import {ReferenceCanvas,listItems} from './reference-layout.jsx';
import {labels,modalText,TourContent,TourPreview} from './reference-content.jsx';
function InlineModal(){const[host,setHost]=useState(null);return <div ref={setHost}>{host&&<Modal visible modalRoot={host} header="Basic Modal" footer={<Box float="right"><Button>Cancel</Button> <Button variant="primary">OK</Button></Box>}>{modalText}</Modal>}</div>}
const list=<Table variant="embedded" columnDefinitions={[{id:'title',header:'Title',cell:x=><><strong>{x.title}</strong><div className="reference-list-description">{x.description}</div></>},{id:'status',header:'Status',cell:x=><Badge color="blue">Step 2</Badge>}]} items={listItems}/>;
const panel=(confirm=false)=><Container header={<Header variant="h3">{confirm?'Popconfirm':'Popover Title'}</Header>}>{confirm?<div className="ref-row"><Button>Cancel</Button><Button variant="primary">OK</Button></div>:'The floating card popped by clicking.'}</Container>;
const tour=(accent=false)=><Container disableContentPaddings><TourContent accent={accent} preview={<TourPreview rows={list}/>} link={<Link>Help info ↗</Link>} button={<><Button>Previous</Button><Button variant="primary">Next</Button></>}/></Container>;
export default function Overview(){return <ReferenceCanvas system="cloudscape" slots={{
 buttons:<><Button variant="primary">Primary Button</Button><Button>Default Button</Button><Button>Danger Button</Button></>,select:<Select selectedOption={{value:'a',label:'Option A'}} options={[{value:'a',label:'Option A'},{value:'b',label:'Option B'}]}/>,date:<DatePicker value="2022-11-18"/>,
 radios:<RadioGroup value="2" items={labels.map((label,i)=>({label,value:String(i),disabled:i>2}))}/>,checkboxes:labels.map((x,i)=><Checkbox key={x} checked={i===2||i===4} disabled={i>2}>{x}</Checkbox>),switches:<div className="ref-stack">{[0,1].map(row=><div className="ref-row" key={row}>{[true,false,true,false].map((x,i)=><Toggle key={i} checked={x} disabled={i>1}/>)}</div>)}</div>,
 modal:<InlineModal/>,popover:panel(),popconfirm:panel(true),message:<StatusIndicator type="success">This is a normal message</StatusIndicator>,
 steps:<Steps orientation="horizontal" steps={[{id:'1',header:'Finished',status:'success'},{id:'2',header:'In Progress',status:'loading'},{id:'3',header:'Waiting',status:'pending'}]}/>,tags:<>{['grey','grey','green','blue','severity-medium','red'].map((color,i)=><Badge key={i} color={color}>{['Tag','+ Tag','Green','Blue','Gold','Red'][i]}</Badge>)}</>,alert:<Alert type="success" dismissible>Success Text</Alert>,list,
 progress:<div className="ref-stack"><ProgressBar value={50}/><ProgressBar value={100} status="success"/><ProgressBar value={70} status="error"/><RingExamples/><div className="ref-row"><StatusIndicator type="in-progress">In Progress</StatusIndicator><StatusIndicator type="success">Success</StatusIndicator><StatusIndicator type="error">Failed</StatusIndicator></div></div>,tour:tour(),tourAccent:tour(true),calendar:<Calendar value="2022-12-19"/>,
 tabs:<div className="ref-row">{[0,1].map(i=><Tabs key={i} activeTabId="1" tabs={[{id:'1',label:'Tab1'},{id:'2',label:'Tab2'},{id:'3',label:'Tab3',disabled:true}]}/>)}<Button variant="primary">Dropdown ⌄</Button></div>,pagination:<Pagination currentPageIndex={2} pagesCount={5}/>,
 timeline:<Steps steps={[1,2,3,4].map(i=>({id:String(i),header:'Create a services site',description:'2015-09-01',status:'success'}))}/>,sliders:<div className="ref-row"><Slider value={40} min={0} max={100}/><Slider value={70} min={0} max={100}/></div>,badges:<><StatusIndicator type="success">Success</StatusIndicator><StatusIndicator type="error">Error</StatusIndicator><Badge color="red">5</Badge></>,floating:<div className="ref-grid">{['status-info','file','file','file','arrow-up','contact','arrow-up','file','close'].map((x,i)=><Button key={i} variant={i===8?'primary':'icon'} iconName={x} ariaLabel="Action"/>)}</div>
}}/>}
