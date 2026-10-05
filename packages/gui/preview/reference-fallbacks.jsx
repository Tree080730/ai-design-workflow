import React from 'react';
// Supplementary presentation compositions. These are NOT official library widgets.
// Their areas/content follow the reference; each adapter supplies its own theme tokens.
const colors=['var(--ref-primary)','var(--ref-success)','var(--ref-error)'];
export function RingExamples(){return <div className="reference-rings">{[68,100,70].map((n,i)=><div className="reference-ring" key={i}><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="var(--ref-border)" strokeWidth="5"/><circle cx="50" cy="50" r="45" fill="none" stroke={colors[i]} strokeWidth="5" strokeDasharray={`${n*2.827} 282.7`} transform="rotate(-90 50 50)"/></svg><span style={{color:i?colors[i]:undefined}}>{i===0?'68%':i===1?'✓':'!'}</span></div>)}</div>}
function Calendar(){return <div className="reference-calendar-composition"><aside>{['last week','today','a week later','a month later','3 months later','6 months later'].map(x=><div key={x}>{x}</div>)}</aside><div><header>‹　　Dec　2022　　›</header><table aria-label="December 2022"><thead><tr>{['Mo','Tu','We','Th','Fr','Sa','Su'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{Array.from({length:5},(_,row)=><tr key={row}>{Array.from({length:7},(_,col)=>{const day=row*7+col-2;return <td key={col} className={day===19?'reference-selected':''}>{day<1?day+30:day>31?day-31:day}</td>})}</tr>)}</tbody></table></div></div>}
export const fallbackSlots={
 date:<div className="reference-date-composition">2022–11–18 <span>▦</span></div>,
 steps:<div className="reference-steps-composition">{['Finished','In Progress','Waiting'].map((x,i)=><React.Fragment key={x}><span className={i===2?'muted':''}><b>{i===0?'✓':i+1}</b>{x}</span>{i<2&&<hr/>}</React.Fragment>)}</div>,
 rating:<div className="reference-rating-composition">★★★★<span>★</span></div>,
 tooltip:<div className="reference-tooltip-composition">Prompt Text</div>,message:<div className="reference-message-composition"><b>✓</b>This is a normal message</div>,alert:<div className="reference-alert-composition"><b>✓</b>Success Text <span>×</span></div>,
 calendar:<Calendar/>,pagination:<div className="reference-pagination-composition">{['‹','1','2','3','4','5','6','7','8','9','›'].map(x=><span key={x} className={x==='2'?'reference-selected':''}>{x}</span>)}</div>,
 timeline:<div className="reference-timeline-composition">{[0,1,2,3].map(x=><div key={x}><i/>Create a services site 2015–09–01</div>)}</div>,
 avatars:<div className="reference-avatars-composition">{['A','U','T','A','U','T'].map((x,i)=><span key={i} className={i>2?'square':''}>{x}</span>)}</div>,
 badges:<div className="ref-row"><span className="reference-success">● Success</span><span className="reference-error">● Error</span><span className="reference-count">5</span><span className="reference-error">●</span></div>
};
