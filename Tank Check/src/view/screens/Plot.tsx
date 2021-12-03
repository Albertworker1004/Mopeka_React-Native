/// <reference types="@types/victory" />

import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect, useDispatch } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  VictoryChart,
  VictoryZoomContainer,
  VictoryLine,
  DomainPropType,
  VictoryScatter,
  VictoryLegend,
  VictoryAxis,
  VictoryTheme,
} from 'victory'
import _ from 'lodash'

import { RootState } from '../store/reducers'
import { setOption } from '../store/reducers/options/reducers'
import { clearPlotData } from '../store/reducers/plot/reducers'
import { utils } from '../../lib/utils'
import { ble } from '../../lib'
import { TankCheck } from '../../lib/sensors/tankcheck'
import { showToast } from '../store/reducers/toaster/reducers'
import LastUpdated from '../components/LastUpdated'

type PlotProps = ReturnType<typeof mapStateToProps> & {
  setOption
  clearPlotData
}

const Plot = (props: PlotProps) => {
  const sensor = ble.sensorList[props.sensorId] as TankCheck
  const [showYellow, setShowYellow] = useState(true)
  const [showRef, setShowRef] = useState(true)
  const [plotRef, setPlotRef] = useState([null, null, null, null])
  const [selectedRef, setSelectedRef] = useState(0)
  const dispatch = useDispatch()

  useEffect(() => {
    ble.gotoPlotPage()

    props.setOption({
      name: 'title',
      val: {
        main: 'Plot',
      },
    })

    // @ts-ignore
    window.plugins.insomnia.keepAwake()

    if (window.localStorage.getItem('plotRef') !== null) {
      console.log('getting refs')

      setPlotRef(JSON.parse(window.localStorage.getItem('plotRef')))
    }

    return function () {
      ble.hidePlotPage()
      // @ts-ignore
      window.plugins.insomnia.allowSleepAgain()
    }
  }, [])

  // Causes a rerender every second
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    let interval = null
    interval = setInterval(() => {
      setSeconds(seconds => seconds + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds])

  const zoomStages: DomainPropType[] = [
    { x: [0, 200] },
    { x: [0, 400] },
    { x: [0, 800] },
    { x: [0, 1600] },
    { x: [0, 3200] },
    { x: [0, 7000] },
    { x: [0, 15000] },
    { x: [0, 30000] },
  ]

  let xMax = 2000
  let yMax = [-0.1, 1]
  let initialZoom = 1
  if (sensor.hwFamily === 'xl') {
    xMax = 5000
    initialZoom = 3
  } else if (sensor.hwFamily === 'pro') {
    xMax = 30000
    initialZoom = 4
    yMax = [-1, 2.5]
  }

  const [zoomStage, setZoomStage] = useState(initialZoom)
  const [zoomedXDomain, setZoomedXDomain] = useState([0, xMax])

  const onDomainChange = domain => {
    setZoomedXDomain(domain.x)
  }

  function getEntireDomain() {
    const { data } = props.plot
    return [data[0].x, _.last(data).x]
  }

  const zoom = (zoomIn: boolean) => {
    let stage
    if (zoomIn) {
      stage = zoomStage - 1
    } else {
      stage = zoomStage + 1
    }
    stage = utils.clamp(stage, 0, zoomStages.length - 1)
    if (zoomStage != stage) {
      setZoomStage(stage)
      setZoomedXDomain(zoomStages[stage]['x'])
    }
  }

  const getData = data => {
    if (!data) return []
    const maxPoints = 300
    if (data.length <= 150) {
      return data
    }
    const filtered = data.filter(d => {
      return d.x >= zoomedXDomain[0] - 50 && d.x <= zoomedXDomain[1] + 50
    })

    // interpolatio to save rendering so many points
    // if (filtered.length > maxPoints ) {
    //   const k = Math.ceil(filtered.length / maxPoints)
    // 	return filtered.filter(
    //   	(d, i) => ((i % k) === 0)
    //   )
    // }
    return filtered
  }

  const savePlotRef = () => {
    console.log('saving ref')

    const ref = {
      data: props.plot.data,
      data1: props.plot.data1,
    }

    plotRef[selectedRef] = ref

    setPlotRef(plotRef)

    window.localStorage.setItem('plotRef', JSON.stringify(plotRef))
  }

  const renderedData = getData(props.plot.data)
  const renderedData1 = getData(props.plot.data1)

  const renderedRefData = getData(plotRef[selectedRef]?.data)
  const renderedRefData1 = getData(plotRef[selectedRef]?.data1)

  // const renderedData = props.plot.data
  // const renderedData1 = props.plot.data1

  return (
    <div>
      <VictoryChart
        padding={{ top: 10, left: 40, right: 5, bottom: 10 }}
        domain={{ y: yMax, x: [0, xMax] } as DomainPropType}
        height={350}
        containerComponent={
          <VictoryZoomContainer onZoomDomainChange={onDomainChange} zoomDomain={zoomStages[zoomStage]} />
        }>
        <VictoryAxis
          theme={VictoryTheme.material}
          tickCount={10}
          style={{
            axis: { stroke: '#756f6a' },
            axisLabel: { fontSize: 20, padding: 30 },
            grid: { stroke: 'grey', opacity: 0.3 },
            tickLabels: { fontSize: 15, angle: 60 } as any,
          }}
        />
        <VictoryAxis
          theme={VictoryTheme.material}
          dependentAxis
          tickCount={8}
          style={{
            axis: { stroke: '#756f6a' },
            axisLabel: { fontSize: 20, padding: 30 },
            grid: { stroke: 'grey', opacity: 0.3 },
            tickLabels: { fontSize: 15, padding: 5 },
          }}
        />
        {showYellow && (
          <VictoryLine
            style={{
              data: { stroke: '#edc240', strokeWidth: 1.35 },
              parent: { border: '1px solid #ccc' },
            }}
            interpolation="linear"
            data={renderedData1}
            // labels={({ datum }) => datum.y > 0.01 ? datum.y : null}
            sortKey="x"
          />
        )}
        {showYellow && (
          <VictoryScatter
            data={renderedData1}
            size={1.5}
            minDomain={{ y: 0.1 }}
            style={{ data: { fill: '#edc240' } }}
          />
        )}
        {showRef && (
          <VictoryLine
            style={{
              data: { stroke: '#a9d6fc', strokeWidth: 1.35 },
              parent: { border: '1px solid #ccc' },
            }}
            interpolation="linear"
            data={renderedRefData}
            // labels={({ datum }) => datum.y > 0.01 ? datum.y : null}
            sortKey="x"
          />
        )}
        {showRef && (
          <VictoryScatter
            data={renderedRefData}
            size={1.5}
            minDomain={{ y: 0.1 }}
            style={{ data: { fill: '#a9d6fc' } }}
          />
        )}
        <VictoryLine
          style={{
            data: { stroke: '#4495db', strokeWidth: 1.35 },
            parent: { border: '1px solid #ccc' },
          }}
          interpolation="linear"
          data={renderedData}
          // labels={({ datum }) => datum.y > 0.01 ? datum.y : null}
          sortKey="x"
        />
        <VictoryScatter data={renderedData} size={1.5} minDomain={{ y: 0.1 }} style={{ data: { fill: '#4495db' } }} />
        <VictoryLine
          style={{
            data: { stroke: '#cb4b4b', strokeWidth: 1.35 },
            parent: { border: '1px solid #ccc' },
          }}
          interpolation="linear"
          data={props.plot.guessLine}
        />
        <VictoryScatter
          data={props.plot.guessLine}
          size={1.5}
          minDomain={{ y: 0.4 }}
          labels={({ datum }) => {
            if (datum.y > 0.3) return props.plot.guessText
            return ''
          }}
          style={{ data: { fill: '#cb4b4b' } }}
        />
      </VictoryChart>
      <div className="flex justify-between mx-3">
        <div className="absolute top-0 right-0 mt-4 mr-4">
          <div className="flex">
            <button onClick={() => zoom(false)} className="px-2 bg-gray-300 rounded shadow">
              <FontAwesomeIcon icon={['fas', 'minus']} size="sm" className="text-gray-700" />
            </button>
            <button onClick={() => zoom(true)} className="px-2 ml-4 bg-gray-300 rounded shadow">
              <FontAwesomeIcon icon={['fas', 'plus']} size="sm" className="text-gray-700" />
            </button>
          </div>
          <button
            className="block px-2 mt-4 ml-auto text-black bg-yellow-500 rounded shadow"
            onClick={() => setShowYellow(!showYellow)}>
            {showYellow ? (
              <FontAwesomeIcon icon={['far', 'eye']} size="sm" className="text-gray-700" />
            ) : (
              <FontAwesomeIcon icon={['far', 'eye-slash']} size="sm" className="text-gray-700" />
            )}
          </button>
        </div>
        <div className="flex">
          {plotRef.map((ref, index) => {
            let bgColor
            if (selectedRef == index) {
              bgColor = 'bg-orange-500'
            } else {
              bgColor = ref != null ? (index == selectedRef ? 'bg-orange-500' : 'bg-orange-300') : 'bg-gray-500'
            }
            return (
              <button className={`px-2 mr-2 ${bgColor} rounded shadow`} onClick={() => setSelectedRef(index)}>
                {index}
              </button>
            )
          })}
          <button className="px-2 mr-2 bg-orange-300 rounded shadow" onClick={() => savePlotRef()}>
            Ref
          </button>
          <button className="px-2 mr-2 bg-orange-300 rounded shadow" onClick={() => setShowRef(!showRef)}>
            {showRef ? (
              <FontAwesomeIcon icon={['far', 'eye']} size="sm" className="text-gray-700" />
            ) : (
              <FontAwesomeIcon icon={['far', 'eye-slash']} size="sm" className="text-gray-700" />
            )}
          </button>
        </div>
        <button
          onClick={() => {
            ble.copyPlotDataAndUpload()
            dispatch(
              showToast({
                type: 'info',
                message: 'Plot data copied to clipboard',
              })
            )
          }}
          className="px-2 py-1 text-sm font-semibold text-center text-gray-700 bg-gray-200 rounded shadow">
          Copy/Upload
        </button>
      </div>
      <div className="flex flex-col mx-3 mt-2 text-sm">
        {/* <span>rendering {renderedData.length} of {props.plot.data.length}</span>
        <span>rendering1 {renderedData1.length} of {props.plot.data1.length}</span> */}
        <div className="flex justify-between">
          <span></span>
          {sensor.hwFamily == 'pro' && (
            <div className="flex">
              <h4 className="mr-2 font-semibold">Bluetooth</h4>
              <span>{sensor.connectState}</span>
            </div>
          )}
        </div>
        <pre>{props.plot.stats}</pre>
      </div>
    </div>
  )
}

const getIdProp = (state, props) => props.match.params.id

const mapStateToProps = (state: RootState, props) => {
  return {
    sensorId: getIdProp(state, props),
    plot: state.plot,
  }
}

const mapDispatch = { setOption, clearPlotData }

export default withRouter(connect(mapStateToProps, mapDispatch)(Plot))
