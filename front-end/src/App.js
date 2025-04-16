import { useEffect, useState, createContext, useRef, lazy, Suspense } from 'react'
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import TopBar from './common/TopBar'
import Welcome from './welcome/Welcome'
import Privacy from './welcome/Privacy'
import ComeBackLater from './welcome/ComeBackLater'
import Loading from './common/Loading'
import { ToastContainer } from 'react-toastify'

const Home = lazy(() => import('./home/Home'))
const Session = lazy(() => import('./session/Session'))
const SessionC = lazy(() => import('./session/SessionC'))

export const LocalStreamContext = createContext()

const CloseButton = ({ closeToast }) => (
  <button className="Toastify__close-button" type="button" aria-label="close" onClick={closeToast}>
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
      <path d="M3.725,86,.314,82.589a1.072,1.072,0,0,1,0-1.516l.758-.758a1.072,1.072,0,0,1,1.516,0L6,83.725l3.411-3.411a1.072,1.072,0,0,1,1.516,0l.758.758a1.072,1.072,0,0,1,0,1.516L8.275,86l3.411,3.411a1.072,1.072,0,0,1,0,1.516l-.758.758a1.072,1.072,0,0,1-1.516,0L6,88.275,2.589,91.686a1.072,1.072,0,0,1-1.516,0l-.758-.758a1.072,1.072,0,0,1,0-1.516Z" transform="translate(0 -80)"/>
    </svg>
  </button>
)

function App() {

  let location = useLocation()
  let navigate = useNavigate()

  const [ localStream, setLocalStream ] = useState()
  const [ mutedLocalStream, setMutedLocalStream ] = useState()
  const [ timeOfDayLimited, setTimeOfDayLimited ] = useState(process.env.NODE_ENV === 'production' ? new Date().getUTCHours() > process.env.REACT_APP_ACCESS_END_TIME && new Date().getUTCHours() < process.env.REACT_APP_ACCESS_START_TIME : null)

  // Refs
  const playVideoAdRef = useRef()
  
  const queryParams = new URLSearchParams(location.search)
  const utm_source = queryParams.get('utm_source')
  const aclid = queryParams.get('aclid')

  useEffect(() => {
    // Routing
    if (timeOfDayLimited) {
      if (location.pathname !== '/come-back-later') {
        navigate('/come-back-later', { replace: true })
      }
    } else {
      if (utm_source) {
        // Campaign routing

        if (!localStorage.getItem('utm_source') && utm_source) localStorage.setItem('utm_source', utm_source)
        if (!localStorage.getItem('aclid') && aclid)  localStorage.setItem('aclid', aclid)

        sessionStorage.setItem('analytics_consent', true)
        sessionStorage.setItem('marketing_consent', true)
        sessionStorage.setItem('tracking_consent', true)
        setShowContentWarning(false)

      } else {
        // Regular routing

        if (!sessionStorage.getItem('tracking_consent')) {
            navigate('/welcome', { replace: true })
          }

      }
    }

  }, [])
  
  return (
    <div className="App">
        <TopBar />
        <main id='main'>
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            draggable={false}
            pauseOnFocusLoss
            pauseOnHover
            theme="colored"
            closeButton={CloseButton}
            icon={({ type }) => {
                if (type === "error") return <svg className='errorIcon' xmlns="http://www.w3.org/2000/svg" height="36" width="36" fill="#FFFFFF" viewBox="0 0 36 36"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M21.79,15.72,19.52,18l2.27,2.27a.71.71,0,0,1,0,1l-.5.51a.71.71,0,0,1-1,0L18,19.51l-2.27,2.28a.71.71,0,0,1-1,0l-.51-.51a.73.73,0,0,1,0-1L16.49,18l-2.28-2.28a.71.71,0,0,1,0-1l.51-.5a.71.71,0,0,1,1,0L18,16.48l2.28-2.27a.71.71,0,0,1,1,0l.5.5A.71.71,0,0,1,21.79,15.72Z"/><path d="M18,0A18,18,0,1,0,36,18,18,18,0,0,0,18,0Zm0,29A11,11,0,1,1,29,18,11,11,0,0,1,18,29Z"/></g></g></svg>
            }}
          />
          { showContentWarning && !timeOfDayLimited && !utm_source ? <ContentWarning setShowContentWarning={setShowContentWarning}/> : null }
          <LocalStreamContext.Provider value={ { localStream, setLocalStream, mutedLocalStream, setMutedLocalStream } }>
            <Routes>
              { timeOfDayLimited ? <Route path='/come-back-later' element={ <ComeBackLater setTimeOfDayLimited={setTimeOfDayLimited}/> } /> : null}
              <Route path='/welcome' element={ <Welcome/> } />
              <Route path='/welcome/privacy' element={ <Privacy /> } />

              <Route path='/home' element={<Suspense fallback={ <Loading /> }> <Home /> </Suspense>} />
              <Route path='/' element={<Suspense fallback={ <Loading /> }> <Home /> </Suspense>} />

              <Route path='/session' element={<Suspense fallback={ <Loading /> }> <Session playVideoAdRef={playVideoAdRef} /> </Suspense>} />

            </Routes>
          </LocalStreamContext.Provider>
        </main>
    </div>
  )  
}

export default App
