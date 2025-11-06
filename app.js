const SESSIONS_KEY = 'sessions.v1'

// View elements
const viewHome = document.getElementById('view-home')
const viewStart = document.getElementById('view-start')
const viewWorkout = document.getElementById('view-workout')
const viewHistory = document.getElementById('view-history')

const btnStart = document.getElementById('btn-start')
const btnHistory = document.getElementById('btn-history')
const navHome = document.getElementById('nav-home')
const navHistory = document.getElementById('nav-history')
const startSessionBtn = document.getElementById('start-session')
const cancelStartBtn = document.getElementById('cancel-start')
const sessionNameInput = document.getElementById('session-name')
const sessionDateInput = document.getElementById('session-date-input')

const workoutTitle = document.getElementById('workout-title')
const exerciseNameInput = document.getElementById('exercise-name')
const setWeightInput = document.getElementById('set-weight')
const setRepsInput = document.getElementById('set-reps')
const setRpeInput = document.getElementById('set-rpe')
const addSetBtn = document.getElementById('add-set')
const addExerciseBtn = document.getElementById('add-exercise')
const newExNameInput = document.getElementById('new-ex-name')
const exerciseBlocksEl = document.getElementById('exercise-blocks')
const finishSessionBtn = document.getElementById('finish-session')
const cancelSessionBtn = document.getElementById('cancel-session')

const sessionListEl = document.getElementById('session-list')

// State
let sessions = []
let currentSession = null
let currentExercise = null

// Utilities
function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}
function saveSessions(){localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))}
function loadSessions(){
  try{const raw = localStorage.getItem(SESSIONS_KEY); sessions = raw?JSON.parse(raw):[] }catch(e){console.error(e);sessions=[]}
}

// Navigation
function showView(v){
  [viewHome,viewStart,viewWorkout,viewHistory].forEach(x=>x.classList.add('hidden'))
  v.classList.remove('hidden')
}

// navigation shortcuts
if(navHome) navHome.onclick = ()=>showView(viewHome)
if(navHistory) navHistory.onclick = ()=>{ renderSessionList(); showView(viewHistory) }

// Session flow
btnStart.onclick = ()=>{sessionNameInput.value=''; showView(viewStart)}
btnHistory.onclick = ()=>{renderSessionList(); showView(viewHistory)}
cancelStartBtn.onclick = ()=>showView(viewHome)

// set default date when opening start view
function openStartView(){
  sessionNameInput.value = ''
  showView(viewStart)
}
btnStart.onclick = openStartView

startSessionBtn.onclick = ()=>{
  const name = sessionNameInput.value.trim() || `Session ${new Date().toLocaleString()}`
  // require user-picked date
  if(!sessionDateInput || !sessionDateInput.value){ alert('Please select a date for this session'); return }
  const dateIso = new Date(sessionDateInput.value + 'T00:00:00').toISOString()
  currentSession = {id:uid(), name, date: dateIso, exercises: []}
  currentExercise = null
  workoutTitle.textContent = name
  renderCurrent()
  showView(viewWorkout)
}

cancelSessionBtn.onclick = ()=>{ if(confirm('Are you sure you want to cancel this session? Unsaved data cannot be recovered.')){ currentSession=null; currentExercise=null; showView(viewHome)} }

function renderCurrent(){
  // render exercise blocks
  exerciseBlocksEl.innerHTML = ''
  if(!currentSession || !currentSession.exercises || currentSession.exercises.length===0){
    exerciseBlocksEl.innerHTML = '<div class="small">No exercises yet. Click "Add Exercise" to begin.</div>'
    return
  }
  for(const ex of currentSession.exercises){
    // build block
    const block = document.createElement('div')
    block.className = 'exercise-block'
    const header = document.createElement('div')
    header.className = 'header'
    const title = document.createElement('div')
    title.innerHTML = `<strong>${ex.name}</strong> <div class="small">${ex.sets.length} sets</div>`
    const headerActions = document.createElement('div')
    const removeBtn = document.createElement('button')
    removeBtn.className = 'remove-ex'
    removeBtn.textContent = 'Remove Exercise'
    removeBtn.onclick = ()=>{ if(confirm('Are you sure you want to delete this exercise? Once deleted, this data cannot be recovered.')){ currentSession.exercises = currentSession.exercises.filter(x=>x.id!==ex.id); if(currentExercise && currentExercise.id===ex.id) currentExercise=null; renderCurrent(); } }
    headerActions.appendChild(removeBtn)
    header.appendChild(title)
    header.appendChild(headerActions)

    const setsDiv = document.createElement('div')
    setsDiv.className = 'sets'
    for(const s of ex.sets){
      const row = document.createElement('div')
      row.className = 'set-row'
      row.innerHTML = `<div><strong>${s.weight} x ${s.reps}</strong> <div class="small">RPE ${s.rpe||'-'}</div></div><div class="item-actions"><button class="delete">Remove</button></div>`
      row.querySelector('button.delete').onclick = ()=>{ ex.sets = ex.sets.filter(x=>x.id!==s.id); renderCurrent() }
      setsDiv.appendChild(row)
    }

    // add-set inputs per block
    const addRow = document.createElement('div')
    addRow.className = 'set-row'
    const weightIn = document.createElement('input')
    weightIn.type='number'; weightIn.placeholder='Weight'
    const repsIn = document.createElement('input')
    repsIn.type='number'; repsIn.placeholder='Reps'
    const rpeIn = document.createElement('input')
    rpeIn.type='number'; rpeIn.placeholder='RPE'; rpeIn.min=1; rpeIn.max=10
    const addBtn = document.createElement('button')
    addBtn.textContent = 'Add Set'
    addBtn.onclick = ()=>{
      const weight = Number(weightIn.value) || 0
      const reps = Number(repsIn.value) || 0
      const rpe = rpeIn.value ? Number(rpeIn.value) : null
      ex.sets.push({id:uid(), weight, reps, rpe})
      weightIn.value=''; repsIn.value=''; rpeIn.value=''
      renderCurrent()
    }
    addRow.appendChild(weightIn); addRow.appendChild(repsIn); addRow.appendChild(rpeIn); addRow.appendChild(addBtn)

    block.appendChild(header)
    block.appendChild(setsDiv)
    block.appendChild(addRow)
    exerciseBlocksEl.appendChild(block)

  }
}

// add-exercise button
if(addExerciseBtn){
  addExerciseBtn.onclick = ()=>{
    const name = newExNameInput && newExNameInput.value.trim()
    if(!name){ alert('Enter an exercise name'); return }
    const ex = {id:uid(), name, sets:[]}
    currentSession.exercises.push(ex)
    if(newExNameInput) newExNameInput.value = ''
    renderCurrent()
  }
}

finishSessionBtn.onclick = ()=>{
  if(!currentSession) return
  if(currentSession.exercises.length===0){ if(!confirm('No exercises have been logged. Do you want to save an empty session?')) return }
  sessions.push(currentSession)
  saveSessions()
  alert('Session saved')
  currentSession=null; currentExercise=null
  showView(viewHome)
}

// History
function renderSessionList(){
  sessionListEl.innerHTML = ''
  if(sessions.length===0){ sessionListEl.innerHTML = '<li class="small">No sessions yet.</li>'; return }
  for(const s of sessions.slice().reverse()){
    const li = document.createElement('li')
    li.className = 'workout-item'
    const meta = document.createElement('div')
    meta.innerHTML = `<div><strong>${s.name}</strong></div><div class="small">${new Date(s.date).toLocaleString()}</div><div class="small">${s.exercises.length} exercises</div>`
    const actions = document.createElement('div')
    actions.className = 'item-actions'
    const viewBtn = document.createElement('button')
    viewBtn.textContent='View'
    viewBtn.onclick = ()=>viewSessionDetail(s.id)
    const delBtn = document.createElement('button')
    delBtn.textContent='Delete'
    delBtn.className='delete'
    delBtn.onclick = ()=>{ if(confirm('Are you sure you want to delete this session? Deleted exercise data cannot be recovered.')){ sessions = sessions.filter(x=>x.id!==s.id); saveSessions(); renderSessionList() } }
    actions.appendChild(viewBtn); actions.appendChild(delBtn)
    li.appendChild(meta); li.appendChild(actions)
    sessionListEl.appendChild(li)
  }
}

function viewSessionDetail(id){
  const s = sessions.find(x=>x.id===id)
  if(!s) return
  workoutTitle.textContent = s.name + ' (History)'
  currentSession = {id: s.id, name: s.name, date: s.date, exercises: JSON.parse(JSON.stringify(s.exercises))}
  currentExercise = null
  renderCurrent()
  showView(viewWorkout)
}

loadSessions();
showView(viewHome)