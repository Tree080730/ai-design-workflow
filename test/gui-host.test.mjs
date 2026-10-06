import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {checkGuiHost} from '../scripts/check-gui-host.mjs';

function mock(replies){
  const methods=[];let args;
  const spawnProcess=(command,argv)=>{
    args=[command,...argv];const child=new EventEmitter();
    child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();
    child.kill=()=>{};
    child.stdin.on('data',bytes=>{
      const message=JSON.parse(bytes.toString());methods.push(message.method);
      queueMicrotask(()=>replies(message,child));
    });return child;
  };
  return {spawnProcess,methods,get args(){return args;}};
}
test('probe reads only the requested thread and never enables dispatch',async()=>{
  const transport=mock((m,c)=>{
    if(m.id===1)c.stdout.write(JSON.stringify({id:1,result:{userAgent:'test'}})+'\n');
    if(m.id===2)c.stdout.write(JSON.stringify({id:2,result:{thread:{id:'current',cwd:process.cwd(),turns:['private']}}})+'\n');
  });
  const result=await checkGuiHost({threadId:'current',project:process.cwd(),socket:'/test.sock',...transport});
  assert.equal(result.status,'readable');assert.equal(result.projectMatches,true);assert.equal(result.canDispatch,false);
  assert.deepEqual(transport.methods,['initialize','initialized','thread/read']);
  assert.deepEqual(transport.args,['codex','app-server','proxy','--sock','/test.sock']);
  assert.ok(!JSON.stringify(result).includes('private'));
});
test('missing thread identity never opens transport',async()=>{
  assert.equal((await checkGuiHost({spawnProcess:()=>{throw Error('must not spawn');}})).reason,'missing-thread-id');
});
test('closed proxy does not start a replacement server',async()=>{
  const transport=mock((m,c)=>c.emit('exit',1));
  assert.equal((await checkGuiHost({threadId:'current',...transport})).reason,'proxy-exited');
  assert.deepEqual(transport.methods,['initialize']);
});
test('silent transport expires',async()=>{
  const transport=mock(()=>{});
  assert.equal((await checkGuiHost({threadId:'current',timeoutMs:10,...transport})).reason,'timeout');
});
test('another thread cannot be mistaken for current conversation',async()=>{
  const transport=mock((m,c)=>c.stdout.write(JSON.stringify({id:m.id,result:m.id===1?{}:{thread:{id:'other'}}})+'\n'));
  assert.equal((await checkGuiHost({threadId:'current',...transport})).reason,'thread-not-readable');
});
test('project mismatch remains explicitly unverified',async()=>{
  const transport=mock((m,c)=>{if(m.id)c.stdout.write(JSON.stringify({id:m.id,result:m.id===1?{}:{thread:{id:'current',cwd:'/other'}}})+'\n');});
  const result=await checkGuiHost({threadId:'current',project:process.cwd(),...transport});
  assert.equal(result.projectMatches,false);assert.equal(result.canDispatch,false);
});
