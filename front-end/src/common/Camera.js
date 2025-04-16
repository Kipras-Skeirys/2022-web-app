import { LocalStreamContext } from '../App'
import { useState, useRef, useEffect, useContext } from "react"
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import ToastMessage from '../utils/toastMessage'
import Loading from '../common/Loading'

function Camera(props) {

    // Router
    let location = useLocation()
    let navigate = useNavigate()

    // Hooks
    const [ frontCameraToggle, setFrontCameraToggle ] = useState(true)
    const [ facingMode, setFacingMode ] = useState(sessionStorage.getItem('setFacingMode') !== 'undefined' ? JSON.parse(sessionStorage.getItem('setFacingMode')) : false)
    const [ mute, setMute ] = useState(sessionStorage.getItem('mute') !== 'undefined' ? JSON.parse(sessionStorage.getItem('mute')) : false)
    const [ cameraLoading, setCameraLoading ] = useState(false)
    const [ cameraSwitchLoading, setCameraSwitchLoading ] = useState(false)
    const [ streamAspectRatio, setStreamAspectRatio ] = useState(sessionStorage.getItem('aspectRatio') || null)


    // Props
    const peerConnection = props.peerConnection

    // Refs
    const videoRef = useRef()
    const cameraContRef = useRef()

    const {localStream, setLocalStream} = useContext(LocalStreamContext)
    const {mutedLocalStream, setMutedLocalStream} = useContext(LocalStreamContext)


    let micClosedSvg = <svg className="micClosed-svg" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 20"><g id="mic-off"><path d="M12.12,3.75a3.74,3.74,0,0,0-6.8-2.17l6.8,6.8Z"/><path d="M15.25,10V8.12a.63.63,0,0,0-.63-.62H14a.62.62,0,0,0-.62.62V9.64l1.73,1.73A6.84,6.84,0,0,0,15.25,10Z"/><path d="M8.38,13.75A3.68,3.68,0,0,0,9,13.7L4.62,9.36V10A3.75,3.75,0,0,0,8.38,13.75Z"/><path d="M11.5,18.12H9.31V16.81a6.7,6.7,0,0,0,2.1-.66L10,14.73A5.16,5.16,0,0,1,8.36,15l-.48,0a5.16,5.16,0,0,1-4.5-5.2V8.12a.62.62,0,0,0-.62-.62H2.12a.62.62,0,0,0-.62.62V9.69a7.09,7.09,0,0,0,5.94,7.1v1.34H5.25a.63.63,0,0,0-.63.62v.63a.64.64,0,0,0,.63.62H11.5a.62.62,0,0,0,.62-.62v-.63A.62.62,0,0,0,11.5,18.12Z"/><path d="M16.71,15.79l-2.38-2.38L12.94,12l-1-1L4.62,3.7,1.71.79A1,1,0,0,0,.29,2.21L4.62,6.54l6.25,6.25.88.88L13.08,15l2.21,2.21a1,1,0,0,0,1.42,0A1,1,0,0,0,16.71,15.79Z"/></g></svg>
    let micOpenSvg = <svg className="micOpen-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.75 20"><g id="mic-on"><path d="M6.88,13.75A3.75,3.75,0,0,0,10.63,10V3.75a3.75,3.75,0,0,0-7.5,0V10A3.74,3.74,0,0,0,6.88,13.75Z"/><path d="M13.13,7.5H12.5a.62.62,0,0,0-.62.63V10a5,5,0,0,1-5,5l-.48,0a5.16,5.16,0,0,1-4.5-5.2V8.13a.63.63,0,0,0-.63-.63H.63A.63.63,0,0,0,0,8.13V9.69a7.09,7.09,0,0,0,5.94,7.1v1.34H3.75a.62.62,0,0,0-.62.62v.63a.62.62,0,0,0,.62.62H10a.63.63,0,0,0,.63-.62v-.63a.62.62,0,0,0-.63-.62H7.81V16.81A6.9,6.9,0,0,0,13.75,10V8.13A.63.63,0,0,0,13.13,7.5Z"/></g></svg>

    function initLocalStream(e, cameraToggle = true, callback) {
        setCameraLoading(true)
        if (e) e.preventDefault()
        if (sessionStorage.getItem('manual_stream_release')) {
            if (localStream) stopStream(localStream, () => {})
            if (mutedLocalStream) stopStream(mutedLocalStream, () => {})
        }
        navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: {
                    facingMode: cameraToggle ? 'user' : 'environment',
                    // width: { max: 1920 },
                    // height: { max: 1080 },
                }
        })
            .then(stream => {
                // Check if there is more than one camera
                navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const videoDevices = devices.filter(device => device.kind === 'videoinput')
                    if (videoDevices && videoDevices.length > 1) {
                        setFacingMode(true)
                        sessionStorage.setItem('setFacingMode', true)
                    } else {
                        sessionStorage.setItem('setFacingMode', false)
                    }
                })
                .catch(err => console.error('Error enumerating devices:', err) )

                if (sessionStorage.getItem('mute') === 'undefined') {
                    sessionStorage.setItem('mute', false)
                    setMute(false)
                } else {
                    stream.getAudioTracks()[0].enabled = !mute
                }
                
                setLocalStream(stream)
                cameraContRef.current.style.boxShadow = 'none'
                setCameraLoading(false)

                if (callback) {
                    callback(stream)
                }
            
            }).catch((err) => {
                if (err.name == "NotAllowedError" || err.name == "PermissionDeniedError") {
                    toast.error(<ToastMessage
                        title={'Camera access blocked'}
                        description={'The camera access is being blocked by your browser settings.'}
                    />, { autoClose: 10000, toastId: 'Camera access blocked' })
                } else if (err.name == "NotReadableError" || err.name == "TrackStartError" || err.name == "AbortError") {
                    if (e && e.target && e.target.className && e.target.className === 'rotate-camera-cont') {
                        sessionStorage.setItem('manual_stream_release', true)
                        initLocalStream(e = null, cameraToggle)
                    } else {
                        toast.error(<ToastMessage
                            title={'Camera in use elsewhere'}
                            description={'The Camera can not be requested while it is active in another app.'}
                        />, { autoClose: 10000, toastId: 'Camera in use elsewhere' })
                    }
                } else {
                    setFacingMode(false)
                    console.log(err.name);
                }
                setCameraLoading(false)
                if (callback) {
                    callback(null)
                }
            })
    }

    function stopStream(stream, callback) {
        const tracks = stream.getTracks()
        tracks.forEach((track) => {
            track.stop()
        })
        if (callback) callback()
    }

    function muteToggle() {

        setMute((prev) => {

            sessionStorage.setItem('mute', !prev)
            localStream.getAudioTracks()[0].enabled = prev
            if (peerConnection) {
                peerConnection.getSenders().forEach((sender) => {
                    if (sender.track.kind === 'audio') {
                        sender.track.enabled = prev
                    }
                })
            }

            return !prev
        })

    }

    function disabledCameraCleanup() {
        setLocalStream(null)
        if (location.pathname === '/session') {
            navigate('/home', { replace: true })
        }
        
        // Check if we are not in campaign matching
        // Check if there anymore "match wihout camera" left
        if (location.pathname.split('/')[1] !== 'match') {
            toast.error(<ToastMessage
                title={'Camera is turned off'}
                description={'You can not participate in matching without an active camera on you.'}
            />)
        }

    }
    
    useEffect(() => {
        if (localStream) {
            // Get the aspect ratio of the video track
            const videoTrack = localStream.getVideoTracks()[0]
            const { width, height } = videoTrack.getSettings()
            const aspectRatio = width / height;

            sessionStorage.setItem('aspectRatio', aspectRatio)
            setStreamAspectRatio(aspectRatio)
        }
        
        if (localStream && videoRef.current.srcObject !== localStream){

            if (mutedLocalStream) stopStream(mutedLocalStream, () => {})

            // Remove audioTrack for local use(chrome autoplay w/ audio fix)
            const muted = localStream.clone()
            const audioTrack = muted.getAudioTracks()
            if (audioTrack.length > 0) {
                muted.removeTrack(audioTrack[0])
            }

            if (!videoRef.current.srcObject) {
                videoRef.current.srcObject = muted
            } else if (videoRef.current.srcObject !== localStream) {
                videoRef.current.srcObject = muted

            }

            videoRef.current.play().catch( () => {} )
            
            setMutedLocalStream(muted)

            localStream.getTracks().forEach( (track) =>  {
                if (track.kind === 'video') {
                    track.onmute = () => {
                        disabledCameraCleanup()
                        track.onunmute  = () => {
                            track.onunmute = null
                        }
                    }
                    track.onended = () => {
                        disabledCameraCleanup()
                    }
                }
            })

            videoRef.current.onloadeddata = () => {
                cameraContRef.current.scrollIntoView(true)
            }
            
        }
        
        return () => {
            if (localStream) {
                localStream.getTracks().forEach( (track) =>  {
                    if (track.kind === 'video') {
                        track.onmute = null
                        track.onended = null
                    }
                })
            }
        }

    }, [localStream])

    useEffect(() => {
        if (videoRef && videoRef.current) {
            videoRef.current.addEventListener( "loadedmetadata", function (e) {
                if (videoRef && videoRef.current && cameraContRef && cameraContRef.current) {
                    if (this.videoWidth >= this.videoHeight) {
                        // cameraContRef.current.style.width = '100%'
                        // cameraContRef.current.style.height = 'fit-content'
                        videoRef.current.style.width = '100%'
                        videoRef.current.style.height = 'auto'
                    } else {
                        // cameraContRef.current.style.width = 'fit-content'
                        // cameraContRef.current.style.height = '100%'
                        // videoRef.current.style.width = 'auto'
                        videoRef.current.style.height = '100%'
                    }
                }
            })
        }
    })

    function facingModeToggle (e) {

        setCameraSwitchLoading(true)
        if (localStream) {
            localStream.getTracks().forEach( (track) =>  {
                if (track.kind === 'video') {
                    track.onended = null
                }
            })
        }
        
        initLocalStream(e, frontCameraToggle ? false : true, (stream) => {
            if (stream) {
                setFrontCameraToggle((prev) => {
                    return !prev
                })
            }
            setCameraSwitchLoading(false)
        })
        
    }

    return (
        <div className="camera-cont" id='camera-cont' ref={cameraContRef}>
            { !localStream
                ?
                    <div className="request-camera" style={ { cursor: cameraLoading ? 'auto' : 'cursor' } } onClick={ cameraLoading ? null : () => initLocalStream() }>
                        <div className="request-camera-cont">
                            { cameraLoading ?
                                <Loading theme={'gray'}></Loading>
                            :
                                <>
                                    <svg className='request-camera-svg' xmlns="http://www.w3.org/2000/svg" width="64.722" height="54.543" viewBox="0 0 64.722 54.543">
                                        <g id="DjmPzo01" transform="translate(0 0)" opacity="0.495">
                                            <path id="Path_90" data-name="Path 90" d="M111.788-609.409a2.554,2.554,0,0,0-1.586,3.47c.327.677.565.9,5.1,4.606,1.041.854,2.964,2.438,4.1,3.387.486.4,1.427,1.178,2.1,1.719s1.279,1.042,1.358,1.125c.109.115.862.729,2.042,1.688,1.665,1.344,1.992,1.615,2.032,1.667s.624.531,1.318,1.1c2.111,1.719,2.488,2.021,2.7,2.209.109.1.6.511,1.09.907s.942.761.991.813.506.406.991.813.981.823,1.09.917.783.636,1.487,1.209,1.338,1.084,1.388,1.157c.079.094.922.771,1.487,1.209.059.042.278.229.5.427s.773.646,1.239,1.011.9.729.981.8c.119.125,1.229,1.042,1.982,1.646.139.115.486.4.753.625.486.4,2,1.646,3.261,2.678.337.271.674.552.753.636s.436.365.793.646.7.573.783.656c.119.115,1.15.969,2.052,1.688.8.646,1.973,1.6,2.022,1.667.03.031.644.552,1.378,1.157,2.815,2.3,5.115,4.2,6.166,5.064.466.385,1.408,1.167,2.082,1.719s1.9,1.563,2.716,2.24,1.774,1.469,2.131,1.751.7.584.783.656a4.736,4.736,0,0,0,2.508,1.365,3.228,3.228,0,0,0,1.566-.646,2.813,2.813,0,0,0,.625-2.814c-.387-.792-.862-1.23-4.143-3.845-.763-.6-1.556-1.261-1.764-1.459l-.377-.344v-14.484c0-8.17-.04-14.662-.089-14.9a7.4,7.4,0,0,0-.674-2.053,5.377,5.377,0,0,0-1.219-1.73,6.829,6.829,0,0,0-.892-.854,1.9,1.9,0,0,1-.486-.26,4.855,4.855,0,0,0-.862-.438c-1.259-.448-1.546-.479-5.779-.542l-4.114-.062-.377-1.25c-.773-2.511-1.031-3.064-1.814-3.887a4.907,4.907,0,0,0-2.518-1.417c-.684-.135-13.412-.156-14.125-.021a5.147,5.147,0,0,0-3.549,2.907,5.925,5.925,0,0,0-.367.938c-.01.063-.2.709-.426,1.428l-.426,1.3-2.5.031-2.5.021-.684-.542-1.933-1.594c-1.675-1.386-3.222-2.657-4.659-3.835-1.606-1.313-3.073-2.532-3.8-3.126a4.075,4.075,0,0,0-1.566-.948l-.446-.115A2.893,2.893,0,0,0,111.788-609.409Zm32.533,20.539a3.325,3.325,0,0,0,.714.146,1.614,1.614,0,0,1,.555.146c.178.083.486.219.694.313a2.159,2.159,0,0,0,.426.167,15.255,15.255,0,0,1,2.587,2.032,10.57,10.57,0,0,1,2.726,5.94c.188,1.448.1,2.449-.2,2.449a2.27,2.27,0,0,1-.515-.365c-.238-.2-.793-.657-1.229-1.011s-.813-.677-.843-.709c-.05-.062-1.943-1.626-3.41-2.813-.387-.313-1.18-.969-1.764-1.459s-1.487-1.24-2.012-1.667-1.08-.886-1.219-1.011-.615-.511-1.031-.834c-.724-.573-.912-.865-.664-1.032a8.421,8.421,0,0,1,2.121-.448A10.017,10.017,0,0,1,144.321-588.871Z" transform="translate(-109.982 609.515)" fill="#b8b8b8"/>
                                            <path id="Path_91" data-name="Path 91" d="M176.059-457.369c-.03.031-.059,6.732-.059,14.88,0,14.61,0,14.808.2,15.422a7.456,7.456,0,0,0,1.536,2.813,7.629,7.629,0,0,0,3.043,1.9c.595.177,1.546.188,19.141.219,14.661.021,18.516,0,18.487-.1a2.1,2.1,0,0,0-.446-.448c-.664-.511-2.032-1.646-2.211-1.813-.089-.094-.6-.521-1.13-.948-.971-.782-1.725-1.407-3.638-2.991-.565-.469-1.834-1.511-2.815-2.324s-1.973-1.636-2.21-1.844c-.476-.406-.426-.406-1.606-.021a11.613,11.613,0,0,1-5.8-.229c-.109-.042-.446-.188-.743-.323a10.829,10.829,0,0,1-4.342-4.074,9.345,9.345,0,0,1-.515-.99c0-.031-.109-.344-.238-.688a11.19,11.19,0,0,1-.644-3.762l-.059-1.553-.694-.563c-.377-.313-.862-.709-1.08-.886s-.724-.615-1.15-.959-1.18-.969-1.7-1.386-1.021-.844-1.13-.938-.4-.344-.644-.552-1-.834-1.685-1.407-1.358-1.125-1.507-1.24-.634-.511-1.071-.886c-1.289-1.073-2.369-1.969-3.469-2.866-.565-.458-1.189-.99-1.4-1.167S176.1-457.411,176.059-457.369Z" transform="translate(-169.456 473.231)" fill="#b8b8b8"/>
                                        </g>
                                    </svg>
                                    <span className='request-camera-text'>Click to request camera access</span>
                                </>
                            }
                        </div>
                    </div>
                :
                    <>  
                        <div className="video-cont" style={ streamAspectRatio ? { aspectRatio: streamAspectRatio } : null }>
                            { cameraSwitchLoading ? <Loading theme={'gray'}></Loading> : null}
                            <video className="camera" ref={videoRef} autoPlay={true} playsInline={true} muted={true}></video>
                        </div>
                        <div className="mic-control-cont" onClick={ () => muteToggle() }>
                            <input type="checkbox" className="mic-control" readOnly={true} checked={!mute}></input>
                            {mute ? micClosedSvg : micOpenSvg}
                        </div>
                        { facingMode
                            ?
                            <div className="rotate-camera-cont" onClick={ cameraSwitchLoading ? null : (e) => facingModeToggle(e) }>
                                <svg className='rotate-camera-svg' xmlns="http://www.w3.org/2000/svg" width="20" height="17.5" viewBox="0 0 20 17.5"><defs></defs><path d="M5.824,33.281,5.418,34.5H2.5A2.5,2.5,0,0,0,0,37V47a2.5,2.5,0,0,0,2.5,2.5h15A2.5,2.5,0,0,0,20,47V37a2.5,2.5,0,0,0-2.5-2.5H14.582l-.406-1.219A1.87,1.87,0,0,0,12.4,32H7.6A1.87,1.87,0,0,0,5.824,33.281ZM15,40.75a.627.627,0,0,1-.625.625h-3a.442.442,0,0,1-.312-.754l.926-.926a2.829,2.829,0,0,0-4,.012l-.77.77A.936.936,0,0,1,5.9,39.152l.77-.77a4.706,4.706,0,0,1,6.648-.016l.926-.926a.442.442,0,0,1,.754.312ZM5,43.25a.627.627,0,0,1,.625-.625h3a.442.442,0,0,1,.312.754l-.926.926a2.829,2.829,0,0,0,4-.012l.77-.77A.936.936,0,1,1,14.1,44.848l-.77.77a4.706,4.706,0,0,1-6.648.016l-.926.926A.442.442,0,0,1,5,46.246Z" transform="translate(0 -32)"/></svg>
                            </div>
                            :
                            null
                        }
                    </>
            }
        </div>
     )
}

export default Camera