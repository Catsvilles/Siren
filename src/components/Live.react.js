import React, { Component } from 'react';
import { connect } from 'react-redux';

import './Home.css';

import { initMyTidal,sendScCommand, sendSCMatrix, sendCommands, startTimer, pauseTimer, stopTimer,
          celluarFill, celluarFillStop, addValues,
          bjorkFill, bjorkFillStop, addBjorkValues,
          consoleSubmit, fbSyncMatrix, fbcreateMatrix, fbLiveTimer, fbupdateMatrix, fbdelete,fborder, fetchModel, fetchModels, updateMatrix,
          startClick,stopClick} from '../actions'
import store from '../store';
import Commands from './Commands.react';
import Firebase from 'firebase';
import {Layout, LayoutSplitter} from 'react-flex-layout';
import CodeMirror from 'react-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/mode/elm/elm';
var options = {
    mode: 'elm',
    theme: 'base16-light',
    fixedGutter: true,
    scroll: true,
    styleSelectedText:true,
    showToken:true,
    lineWrapping: true,
    showCursorWhenSelecting: true
};
class Live extends Component {
  constructor(props) {
    super(props);
    this.state={

      matName: "",
      modelName : "Matrices",
      modelNameLive : "Live",
      tidalServerLink: 'localhost:3001',
      duration: 16,
      steps: 16,
      channels: ['d1','d2','d3', 'd4', 'd5', 'd6', 'd7', 'd8',
                'd9','sendOSC procS1',
                'sendOSC procS2', 'sendOSC procS3'],
      timer: { isActive: false,
               current: null,
               isCelluarActive: false,
               isBjorkActive: false },
      values: {},
      scCommand: '',
      click : {current:null,
              isActive:false},
      density: 8,
      activeMatrix: '',
      songmodeActive: false,
      sceneIndex: '',
      sceneSentinel: false
    }
  }
  //Clock for Haskell
  // componentDidMount(props,state){
  //   const ctx = this;
  //
  //   const items = ctx.props[ctx.state.modelName.toLowerCase()];
  //   const snd = (Object.values(items).length);
  //
  //
  //   var socket = io('http://localhost:3003/');
  //   socket.on("osc", data => {
  //
  //     this.startClick();
  //   })
  //   socket.on("dc", data => {
  //     this.stopClick();
  //   })
  //
  //   ctx.setState( {sceneIndex: snd} );
  // }

  startClick() {
    const ctx=this;
    store.dispatch(startClick());
  }

  componentDidUpdate(props, state) {

    const ctx=this;
    const { channelcommands, commands, timer, click}=props;
    const { steps, tidalServerLink, values, density, duration, channels, activeMatrix, songmodeActive }=state;
    if (timer.isActive) {
      const runNo=(timer.current % steps) + 1;

      if(timer.current % steps === steps-1){
        if(timer.isCelluarActive)
          ctx.celluarFill(values, commands, density, steps, duration, channels, timer);
        else if(timer.isBjorkActive)
          ctx.bjorkFill(values, commands, density, steps, duration, channels, timer);
        else if(songmodeActive)
          ctx.progressMatrices(ctx.props[ctx.state.modelName.toLowerCase()]);

      }

      const vals=values[runNo];

      if (vals !== undefined) {
        ctx.sendCommands(tidalServerLink, vals, channelcommands, commands );
      }
    }
  }

  progressMatrices(items){
    const ctx = this;
    const { commands, timer} = ctx.props;
    const { values, activeMatrix, steps, songmodeActive} = ctx.state;

    timer.isActive = false;
    if(timer.current % steps === steps-1 && songmodeActive)
    {
      var i_save = -1;
      _.forEach(items, function(d, i, j){
        if(d.matName === activeMatrix)
        {
          i_save = _.indexOf(Object.values(items), d);
        }
      })

      const nextObj = Object.values(items)[(i_save+1)%Object.values(items).length];
      updateMatrix(values, nextObj);
      ctx.setState({ activeMatrix : nextObj.matName });
    }
  }

  enableSongmode(){
    this.setState({ songmodeActive : true});
  }
  disableSongmode(){
    this.setState({ songmodeActive : false});
  }

  startTimer() {
    const ctx=this;
    const { duration, steps }=ctx.state;
    fbLiveTimer(ctx.state.modelNameLive, {duration:duration, steps:steps, notf: "start"});
    // store.dispatch(startTimer(duration, steps));
  }

  pauseTimer() {
    const ctx=this;
    const { duration, steps }=ctx.state;
    // store.dispatch(pauseTimer());
  fbLiveTimer(ctx.state.modelNameLive, {duration:duration, steps:steps, notf: "pause"});
  }

  stopTimer() {
    const ctx=this;
    const { duration, steps }=ctx.state;
    fbLiveTimer(ctx.state.modelNameLive, {duration:duration, steps:steps, notf: "stop"});
    // store.dispatch(stopTimer());
  }

  runTidal() {
    const ctx=this;
    const { tidalServerLink } = ctx.state;
    store.dispatch(initMyTidal(tidalServerLink));
  }

  sendCommands(tidalServerLink, vals, channelcommands, commands) {
    store.dispatch(sendCommands(tidalServerLink, vals, channelcommands, commands));
  }
  sendSCMatrix(tidalServerLink, vals, commands) {
    store.dispatch(sendSCMatrix(tidalServerLink, vals, commands));
  }

  sendScCommand(tidalServerLink, command) {
    store.dispatch(sendScCommand(tidalServerLink, command));
  }

  addValues(values, commands, density, steps, duration, channels, timer){
    store.dispatch(addValues(values, commands, density, steps, duration, channels, timer));
  }
  celluarFill(values, commands, density, steps, duration, channels, timer){
    store.dispatch(celluarFill(values, commands, density, steps, duration, channels, timer));
  }
  celluarFillStop(){
    store.dispatch(celluarFillStop());
  }

  addBjorkValues(values, commands, density, steps, duration, channels, timer){
    store.dispatch(addBjorkValues(values, commands, density, steps, duration, channels, timer));
  }
  bjorkFill(values, commands, density, steps, duration, channels, timer){
    store.dispatch(bjorkFill(values, commands, density, steps, duration, channels, timer));
  }
  bjorkFillStop(){
    store.dispatch(bjorkFillStop());
  }

  consoleSubmit(tidalServerLink, value){
    store.dispatch(consoleSubmit(tidalServerLink, value));
  }

  handleSubmit = event => {
    const body=event.target.value
    const ctx=this;
    const {scCommand, tidalServerLink }=ctx.state;

    if(event.keyCode === 13 && event.ctrlKey && body){
      ctx.sendScCommand(tidalServerLink, scCommand);
    }
  }

  handleConsoleSubmit = event => {
    const value = event.target.value;
    const ctx = this;
    const {tidalServerLink} = ctx.state;

    if(event.keyCode === 13 && event.ctrlKey && value){
      ctx.consoleSubmit(tidalServerLink, value);
    }
  }

  updateMatrix(values, item) {

    // DEBUG!!!!
    // print every scenename with its sceneIndex
    const items = this.props[this.state.modelName.toLowerCase()]
    console.log('SCENES: ');
    _.forEach(Object.values(items), function(d){
      console.log(d.matName + ' ' + d.sceneIndex);
    });

    store.dispatch(updateMatrix(values, item));
  }

  renderPlayer() {
    const ctx=this;
    const { channels, steps }=ctx.state;
    const playerClass="Player Player--" + (channels.length + 1.0) + "cols";
    var count = 1;
    return (<div className="Player-holder">
      <div className={playerClass}>
        <div className="playbox playbox-cycle">cycle</div>
        {_.map(channels, c => {
          if(_.includes(c, "sendOSC")){
            c = "p"+count++;
          }
          return <div className="playbox playbox-cycle" key={c}>{c}</div>
        })}
      </div>
      {_.map(Array.apply(null, Array(steps)), ctx.renderStep.bind(ctx))}
    </div>)
  }

  renderStep(x, i) {
    const ctx=this;
    const { channels, steps , duration}=ctx.state;
    const { commands, timer,click }=ctx.props;
    const cmds=_.uniq(_.map(commands, c => c.name));
    const currentStep=timer.current % steps;
    var playerClass="Player Player--" + (channels.length + 1.0) + "cols";
    if (i === currentStep) {
      playerClass += " playbox-active";
    }
    var colCount=0;

    return <div key={i} className={playerClass}>
      <div className="playbox playbox-cycle">{i+1}</div>
      {_.map(channels, c => {
        const setText=({ target: { value }}) => {
          const {values}=ctx.state;

          if (values[i+1] === undefined) values[i+1]={}
          values[i+1][c] = value;

          fbSyncMatrix(ctx.state.modelNameLive, {values, duration, steps }).then(function(){
            ctx.setState({values});
          });
        }

        const getValue=() => {
          const {values}=ctx.state;

          var key, val;
          Firebase.database().ref("/live/values/"+(i+1)).once('value', function(snapshot){
            if(snapshot.val() !== undefined && snapshot.val() !== null){
              key = Object.keys(snapshot.val())[0]
              val = Object.values(snapshot.val())[0];
            }
          })
          if(c === key){
            if (values[i+1] === undefined) values[i+1]={}
            values[i+1][c] = val;
            return val;
          }
          // const values=ctx.state.values;
          // if (values[i+1] === undefined || values[i+1][c] === undefined) return ''
          // return values[i+1][c];
        }

        const textval=getValue();
        const index=channels.length*i+colCount++;

        const height = 85/steps;
        return <div className="playbox" style={{height: height+'vh'}} key={c+'_'+i}>
          <textarea className={'commandDiv'} value={textval} onChange={setText}/>
        </div>
      })}
    </div>;
  }

  changeName({target: { value }}) {
    const ctx = this;
    ctx.setState({ matName: value , sceneSentinel: false});
  }

  addItem() {
    const ctx = this
    const { commands } = ctx.props;
    const { matName, activeMatrix, values, sceneIndex } = ctx.state;
    const items = ctx.props[ctx.state.modelName.toLowerCase()];
    console.log(items);

    if ( matName.length >= 2 && _.isEmpty(values) === false) {
      var snd = Object.values(items).length;

      fbcreateMatrix(ctx.state.modelName, { matName , commands, values, sceneIndex: snd });
      ctx.setState({sceneIndex: snd});
    }
  }

  reorder (index,flag){

    const ctx = this;
    const { commands } = ctx.props;
    const { matName, values, sceneIndex } = ctx.state;
    const items = ctx.props[ctx.state.modelName.toLowerCase()];

    const keys = Object.keys(items);
    const vals = Object.values(items);
    const len = keys.length;

    if(flag == "up" && index == 0)
      return;
    else if(flag == "down" && len-1 == index)
      return;
    else{
      if(flag == "up"){
        console.log("KEY INDEX: " + vals[index].sceneIndex);
        console.log("INDEX: " + index);

        if (vals[index].sceneIndex === index){
          var upIndex = index - 1;
          var upMatName = vals[upIndex].matName;
          var upValues = vals[upIndex].values;
          var upCommands = vals[upIndex].commands;
          var downMatName = vals[index].matName;
          var downValues = vals[index].values;
          var downCommands = vals[index].commands;

          fborder(ctx.state.modelName, {matName: upMatName,   commands: upCommands, values: upValues, sceneIndex: index},    keys[upIndex]);
          fborder(ctx.state.modelName, {matName: downMatName, commands: downCommands, values: downValues, sceneIndex: upIndex},  keys[index]);
        }
      }
      else if (flag === "down") {
        if (vals[index].sceneIndex === index){
          var downIndex = index + 1;
          var downMatName = vals[downIndex].matName;
          var downCommands = vals[downIndex].commands;
          var downValues = vals[downIndex].values;
          var upMatName = vals[index].matName;
          var upCommands = vals[index].commands;
          var upValues =  vals[index].values;

          fborder(ctx.state.modelName, {matName: downMatName, commands: downCommands, values: downValues, sceneIndex: index}, keys[downIndex]);
          fborder(ctx.state.modelName, {matName: upMatName,   commands: upCommands, values: upValues, sceneIndex: downIndex}, keys[index]);
        }
      }
    }
  }
  renderItem(item, dbKey, i) {
    const ctx = this;
    const { values, activeMatrix } = ctx.state;
    const model = fetchModel(ctx.state.modelName);

    const updateMatrix = () => {
      const { commands } = ctx.props;
      ctx.setState({ activeMatrix: item.matName, matName: item.matName, sceneSentinel: true });
      ctx.updateMatrix(values, item);
    }

    const handleDelete = ({ target: { value }}) => {
      const payload = { key: dbKey };
      fbdelete(ctx.state.modelName, payload);

      // re-order all items after delete successfull
      Firebase.database().ref("/matrices").once('child_removed').then(function(oldChildSnapshot) {
        const items = ctx.props[ctx.state.modelName.toLowerCase()];
        ctx.setState({sceneIndex: (Object.values(items).length)});
        _.forEach(Object.values(items), function(d, i){
          fborder(ctx.state.modelName, {matName: d.matName, commands: d.commands, values: d.values, sceneIndex: i}, d.key);
        });
      }, function(error) {
        console.error(error);
      });
    }

    return item.key && (
      <div key={item.key} className="matrices" >
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', margin: '1px'}}>
          <button onClick={handleDelete}>{'₪'}</button>
          {activeMatrix === item.matName && <button className={'buttonSentinel'} onClick={updateMatrix} style={{ color: 'rgba(255,255,102,0.75)'}}>{item.matName}</button>}
          {activeMatrix !== item.matName && <button className={'buttonSentinel'} onClick={updateMatrix} style={{ color: '#ddd'}}>{item.matName}</button>}
          <button onClick={ctx.reorder.bind(ctx,item.sceneIndex, 'up')}>{'↑'} </button>
          <button onClick={ctx.reorder.bind(ctx,item.sceneIndex, 'down')}>{'↓'}</button>
        </div>
      </div>
    )
  }

  renderItems(items) {
    const ctx = this;
    return _.map(items, ctx.renderItem.bind(ctx));
  }

  renderMetro(){
    const ctx=this;
    const { click }=ctx.props;
    const currentStep=click.current;
    var metro="metro metro--" ;
    if (currentStep % 2 == 0 ) {
      metro += " metro-active";
    }
    else {
      metro = "metro metro--"
    }
    return <div className={metro}>{}
      <input type="text" placeholder= "Metro"/>
  </div>

  }
  renderMenu(){
    const ctx=this;
    const { tidal, timer, click }=ctx.props;
    const { scCommand, tidalServerLink }=ctx.state;
    const { commands }=ctx.props;
    const { values, density, steps, duration, channels}=ctx.state;

    const bjorkFillStop=() => {
      ctx.bjorkFillStop();
    }
    const bjorkFill=() => {
      ctx.bjorkFill(values, commands, density, steps, duration, channels, timer)
    }
    const addBjorkValues =() => {
      ctx.addBjorkValues(values, commands, density, steps, duration, channels, timer)
    }

    const celluarFillStop=() => {
      ctx.celluarFillStop();
    }
    const celluarFill=() => {
      ctx.celluarFill(values, commands, density, steps, duration, channels, timer)
    }
    const addValues=() => {
      ctx.addValues(values, commands, density, steps, duration, channels, timer)
    }
    const updateDensity=({ target: { value } }) => {

      ctx.setState({density: value});
    }

    const getValue=() => {
        return ctx.state.density;
    }

    const textval=getValue();

    const updateTidalServerLink=({ target: { value } }) => {
        ctx.setState({ tidalServerLink: value });
    }

    const updateScCommand=({ target: { value } }) => {
      ctx.setState({scCommand: value})
    }


      // REPLACING START PAUSE STOP WITH IMAGES
      // {!timer.isActive && <img src={require('../assets/play_icon.png')} onClick={ctx.startTimer.bind(ctx)} height={32} width={32}/>}
      // {timer.isActive && <div> <img src={require('../assets/pause_icon.png')} onClick={ctx.pauseTimer} height={32} width={32}/>
      //                          <img src={require('../assets/stop_icon.png')} onClick={ctx.stopTimer} height={32} width={32}/> </div>}



    return   <div className="Tidal" style={{margin: '5px'}}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center'}}>
        Tidal Server Link
        <input type="text" value={tidalServerLink} onChange={updateTidalServerLink}/>
        {!tidal.isActive && <button className={'buttonSentinel'} onClick={ctx.runTidal.bind(ctx)}>Start SC</button>}
        {tidal.isActive && <button className={'buttonSentinel'}>Running</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center'}}>
        {!timer.isActive && <button className={'buttonSentinel'} onClick={ctx.startTimer.bind(ctx)}>Start timer</button>}
        {timer.isActive && <div> <button className={'buttonSentinel'} onClick={ctx.pauseTimer.bind(ctx)}>Pause</button>
                                 <button className={'buttonSentinel'} onClick={ctx.stopTimer.bind(ctx)}>Stop</button> </div>}
        <pre style={{marginTop: '0px'}}>{JSON.stringify(timer, null, 2)}</pre>
      </div>
      <div id="Command">
         <p>SuperCollider Command</p>
         <input type="textarea" value={scCommand} onChange={updateScCommand} placeholder={'Ctrl + Enter '} onKeyUp={ctx.handleSubmit.bind(ctx)} rows="20" cols="30"/>
      </div>
      <div id="Celluar">
         <p>Cellular Automata Updates</p>
         <input type="textarea" value={textval} onChange={updateDensity} placeholder="" rows="20" cols="30"/>
         {!timer.isCelluarActive && <button onClick={celluarFill}>Run</button>}
         {timer.isCelluarActive && <button onClick={celluarFillStop}>Stop</button>}
         <button onClick={addValues}>  Add  </button>
      </div>
      <div id="Celluar">
         <p>Bjorklund Algorithm Updates</p>
         {!timer.isBjorkActive && <button onClick={bjorkFill}>Run</button>}
         {timer.isBjorkActive && <button onClick={bjorkFillStop}>Stop</button>}
         <button onClick={addBjorkValues}>  Add  </button>
      </div>
      </div>
  }



  render() {
    const ctx=this;
    const { tidal, timer, click, commands }=ctx.props;
    const { scCommand, tidalServerLink, values, density, steps, duration, channels, songmodeActive }=ctx.state;

    const getValue=() => {
        return ctx.state.density;
    }
    const textval=getValue();

    const viewPortWidth = '100%'

    const items = ctx.props[ctx.state.modelName.toLowerCase()];
    var options = {
        mode: 'elm',
        theme: 'base16-light',
        fixedGutter: true,
        scroll: true,
        styleSelectedText:true,
        showToken:true,
        lineWrapping: true,
        showCursorWhenSelecting: true
    };

    const getDur=() => {
        return ctx.state.duration;
    }
    const durval = getDur();
    const updateDuration=({ target: { value } }) => {

      ctx.setState({duration: value});
    }
    return <div className={"Home cont"}>
      <Layout fill='window'>
        <Layout layoutWidth={120}>
          <div id="matrices" style={{width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', margin: '2px'}}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '10px', paddingBottom: '10px'}}>
              <input className={'newCommandInput'} placeholder={'New Scene Name'} value={ctx.state.matName} onChange={ctx.changeName.bind(ctx)}/>
              {this.state.sceneSentinel && <button onClick={ctx.addItem.bind(ctx)}>Update</button>}
              {!this.state.sceneSentinel && <button onClick={ctx.addItem.bind(ctx)}>Add</button>}
            </div>
            <div>
              {!songmodeActive && <button className={'buttonSentinel'} onClick={ctx.enableSongmode.bind(ctx)}>Start Songmode</button>}
              {songmodeActive && <button className={'buttonSentinel'} onClick={ctx.disableSongmode.bind(ctx)}>Stop Songmode</button>}
            </div>
            <div className={'sceneList'} style={{ width: '100%'}}>
              <ul style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', padding: '0', margin: '0'}}>
                {ctx.renderItems(items)}
              </ul>
            </div>
          </div>
        </Layout>
        <LayoutSplitter />
        <Layout layoutWidth='flex'>
          {ctx.renderPlayer()}
        </Layout>
        <LayoutSplitter />
        <Layout layoutWidth={250}>
          <div className="Commands" >
            <div className="CommandsColumn" >
              <Commands />
            </div>

          </div>
        </Layout>
        <LayoutSplitter />
        <Layout layoutWidth={200}>
          <div style={{display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            {ctx.renderMenu()}
            <div id="Execution" style={{alignSelf:'center'}}>
              <textarea className="defaultCommandArea"  onKeyUp={ctx.handleConsoleSubmit.bind(ctx)} placeholder="Tidal Command Here (Ctrl + Enter)" width={'100%'}/>

            </div>
            <div id="Celluar">
            <p>Duration</p>
               <input type="textarea" value={durval} onChange={updateDuration} placeholder={""}  rows="20" cols="30"/>
            </div>

          </div>
        </Layout>
      </Layout>
    </div>

  }
}
export default connect(state => state)(Live);
