import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import { PlotState, PlotPayload } from './types'

const initialState: PlotState = {
  data: [],
  data1: [],
  guessLine: [],
  guessText: '',
  stats: '',
}

const plotSlice = createSlice({
  name: 'plot',
  initialState,
  reducers: {
    setPlotData(state, action: PayloadAction<PlotPayload>) {
      const d = action.payload.data.map(c => {
        return { x: c[0], y: c[1] }
      })
      const d2 = action.payload.data1.map(c => {
        return { x: c[0], y: c[1] }
      })
      const d3 = action.payload.guessLine.map(c => {
        return { x: c[0], y: c[1] }
      })
      state.data = d
      state.data1 = d2
      state.guessLine = d3
      state.guessText = action.payload.guessText
      state.stats = action.payload.stats
    },
    clearPlotData(state) {
      state.data = []
      state.data1 = []
      state.guessLine = []
      state.guessText = ''
      state.stats = 'Waiting for data...'
    },
  },
})

export const { setPlotData, clearPlotData } = plotSlice.actions

export default plotSlice.reducer
