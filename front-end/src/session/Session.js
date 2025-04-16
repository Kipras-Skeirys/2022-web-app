import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, useSearchParams } from "react-router-dom"
import Chat from '../common/Chat'
import Camera from '../common/Camera'
import RemoteCamera from './RemoteCamera'
import Loading from '../common/Loading'
import AboveChatAdBanner from '../common/AboveChatAdBanner'
import VideoAd from '../common/VideoAd'
import searchingAPI from '../api/searchingAPI'
import in_sessionAPI from '../api/in_sessionAPI'
import socket from '../api/socket'
import { LocalStreamContext } from '../App'
import adapter from 'webrtc-adapter'
import trackingEvents from '../utils/trackingEvents'
import { toast } from 'react-toastify'
import ToastMessage from '../utils/toastMessage'
import { Helmet } from 'react-helmet'


function Session(props) {

    let navigate = useNavigate()
    let [searchParams, setSearchParams] = useSearchParams()

    // Props
    const playVideoAdRef = props.playVideoAdRef

    // Hooks
    const [ userId, setUserId ] = useState()
    const [ isLoadingDisabled, setIsLoadingDisabled ] = useState()
    const [ chatMessages, setChatMessages ] = useState()
    const [ sessionStatus, setSessionStatus ] = useState(playVideoAdRef && playVideoAdRef.current === true ? 'ad' : 'searching')
    const [ sessionStatusAfterAd, setSessionStatusAfterAd ] = useState('searching')
    const [ mobileQueryTrigger, setMobileQueryTrigger ] = useState(window.matchMedia("(max-width: 650px)").matches)
    const [ adQueryTrigger, setAdQueryTrigger ] = useState(window.matchMedia("(max-width: 1200px)").matches)
    const [ loadingText, setLoadingText ] = useState()
    const [ loadingPaused, setLoadingPaused ] = useState(false)
    const [ remoteVideoRefState, setRemoteVideoRefState ] = useState()
    const [ chatControlsDisabled, setChatControlsDisabled ] = useState(false)
    const [ remoteTrack, setRemoteTrack ] = useState([])
    const [ firstMatch, setFirstMatch ] = useState(true)
    const [ allowVideoAd, setAllowVideoAd ] = useState(true)
    const [ skipButtonText, setSkipButtonText ] = useState()
    const [ skipButtonDisabled, setSkipButtonDisabled ] = useState()
    const [ secondaryText, setSecondaryText ] = useState()

    // Context
    const {localStream, setLocalStream} = useContext(LocalStreamContext)

    // Refs
    const peerConnection = useRef()
    const tenSecondMarkRef = useRef()
    const videoAdTimeoutIDRef = useRef()
    const candidates = useRef()
    const bytesIO = useRef()
    const partnerId = useRef()
    const failedMatchRef = useRef()


    async function getIceCredentials() {
        return new Promise((resolve, rejest) => {
            socket.emit('webRTC_getIceCredentials', (iceCredentials) => {
                resolve(iceCredentials)
            })

        })
    }


    function bandwidthControl(peerConnection, videoBandwidth, audioBandwidth) {

        if (peerConnection.connectionState === 'connecting' || peerConnection.connectionState === 'connected'){
            if (
                (adapter.browserDetails.browser === 'chrome' ||
                adapter.browserDetails.browser === 'safari' ||
                (adapter.browserDetails.browser === 'firefox' &&
                adapter.browserDetails.version >= 64)) &&
                'RTCRtpSender' in window &&
                'setParameters' in window.RTCRtpSender.prototype
            ){
                const senders = peerConnection.getSenders()
                if (senders.length && senders[0].transport.state === 'connected') {
                    senders.forEach((sender) => {
                        if (sender.track.kind === 'video'){
                            const parameters = sender.getParameters()
                            if (!parameters.encodings) {
                                parameters.encodings = [{}]
                            }
                            if (videoBandwidth === 'unlimited' && parameters.encodings && parameters.encodings[0] && parameters.encodings[0].hasOwnProperty('maxBitrate')) {
                                delete parameters.encodings[0].maxBitrate
                            } else if (parameters.encodings[0].maxBitrate !== videoBandwidth && videoBandwidth !== 'unlimited') {
                                parameters.encodings[0].maxBitrate = videoBandwidth
                            }
                            sender.setParameters(parameters).catch(e => console.error(e))
                        }
                        if (sender.track.kind === 'audio' && audioBandwidth){
                            const parameters = sender.getParameters()
                            if (!parameters.encodings) {
                                parameters.encodings = [{}]
                            }
                            if (audioBandwidth === 'unlimited' && parameters.encodings && parameters.encodings[0] && parameters.encodings[0].hasOwnProperty('maxBitrate')) {
                                delete parameters.encodings[0].maxBitrate
                            } else if (parameters.encodings && parameters.encodings[0].maxBitrate !== audioBandwidth && audioBandwidth !== 'unlimited') {
                                parameters.encodings[0].maxBitrate = audioBandwidth
                            }
                            sender.setParameters(parameters).catch(e => console.error(e))
                        }
        
                    })
                }
            } else (
                peerConnection.createOffer()
                    .then(offer => peerConnection.setLocalDescription(offer))
                    .then(() => {
                        const desc = {
                            type: peerConnection.remoteDescription.type,
                            sdp: videoBandwidth === 'unlimited' ?
                            removeSdpBandwidthRestriction(peerConnection.remoteDescription.sdp) :
                            updateSdpBandwidth(peerConnection.remoteDescription.sdp, videoBandwidth)
                        }
                        return peerConnection.setRemoteDescription(desc)
                    })
            )
        }else {
            console.log('[Notice] Unhandled peerConnection closure');
        }
    }

    function updateChatMessages(message) {
        setChatMessages((prev) => {
            if (prev) {
                return([...prev, ...message])
            } else {
                return(message)
            }
        })
        if (message[0].sender_id && !message[0].announcement && message[0].sender_id === userId) {
            socket.emit('message', message[0].message)
        }
    }

    function handleIceCadidates(peerConnection) {
        peerConnection.addEventListener('icecandidate', (e) => {
            if(e.candidate) {
                socket.emit('webRTC_iceCadidate', e.candidate)
            }
        })
    }

    function addTracks(peerConnection) {
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream)
            })
        } else {
            navigate('/home')
        }
    }

    function connectionStateChange(peerConnection) {
        peerConnection.addEventListener('connectionstatechange', event => {
            socket.emit('webRTC_connectionState', peerConnection.connectionState)
            socket.emit('webRTC_state', peerConnection.connectionState)
            switch (peerConnection.connectionState) {
                case 'connecting':
                    bandwidthControl(peerConnection, 75000, 10000)
                    // bandwidthControl(peerConnection.current, 'unlimited', 'unlimited')
                case 'connected':
                    setChatControlsDisabled(false)
                    let localCandidateId
                    let remoteCandidateId
                    peerConnection.getStats(null).then((stats) => {   
                        let localCandidateType
                        let remoteCandidateType                     
                        let bytesSent                     
                        let bytesReceived                     
                        stats.forEach((rtcStats) => {
                            if (rtcStats.type === 'candidate-pair' && rtcStats.state === 'succeeded') {
                                localCandidateId = rtcStats.localCandidateId
                                remoteCandidateId = rtcStats.remoteCandidateId
                                bytesSent = rtcStats.bytesSent
                                bytesReceived = rtcStats.bytesReceived
                            }
                            if (rtcStats.type === "local-candidate" && localCandidateId && rtcStats.id === localCandidateId) {
                                localCandidateType =  rtcStats.candidateType
                            }
                            if (rtcStats.type === "remote-candidate" && remoteCandidateId && rtcStats.id === remoteCandidateId) {
                                remoteCandidateType = rtcStats.candidateType
                            }
                        })
                        return {
                            candidates: { localCandidateType: localCandidateType, remoteCandidateType: remoteCandidateType },
                            bytesIO: { bytesSent: bytesSent, bytesReceived: bytesReceived }
                        }
                    }).then((data) => {
                        bytesIO.current = data.bytesIO
                        candidates.current = data.candidates
                    })
                    break
                case 'disconnected':
                case 'closed':
                case 'failed':
                    if (sessionStatus === 'in_session' || sessionStatus === 'connecting') {
                        in_sessionAPI.end({ candidates: candidates.current, bytesIO: bytesIO.current })
                        setSessionStatus('post_session')
                    }
                    break
            }
        })
    }

    function addRemoteTracks(peerConnection) {
        peerConnection.addEventListener('track', async (event) => {
            setRemoteTrack((prev) => {
                return ( [ ...prev, ...event.streams ] )
            })
        })
    }

    function onnegotiationneededListener(peerConnection) {
        peerConnection.onnegotiationneeded = (event) => {
        }
    }

    function removeSdpBandwidthRestriction(sdp) {
        return sdp.replace(/b=AS:.*\r\n/g, '').replace(/b=TIAS:.*\r\n/g, '');
    }

    function updateSdpBandwidth(sdp, bandwidth) {

        let modifier = 'AS'
        let newSdp

        if (adapter.browserDetails.browser === 'firefox') {
            bandwidth = (bandwidth >>> 0)
            modifier = 'TIAS'
        }

        if (sdp.indexOf('b=' + modifier + ':') === -1) {
            // insert b= after c= line.
            newSdp = sdp.replace(/c=IN (.*)\r\n/g, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
        } else {
            newSdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
        }

        return newSdp

    }

    function mobileQueryChange(state) {
        const topBar = document.getElementById('topBar')
        const main = document.getElementById('main')
        const cameraCont = document.getElementById('camera-cont')
        const cameraSideCamera = document.getElementsByClassName('camera-side-camera')
        if (state === true) {
            if (topBar) { topBar.style.display = 'none' }
            if (main) { main.style.height = '100%' }
            if (cameraCont) { cameraCont.style.position = 'inherit' }
            if (cameraSideCamera.length) { cameraSideCamera[0].style.justifyContent = 'start' }
            
        } else {
            if (topBar) { topBar.style.display = 'block' }
            if (main) { main.style.height = 'calc(100% - (22px + 2rem))' }
            if (cameraCont) { cameraCont.style.position = 'relative' }
            if (cameraSideCamera.length) { cameraSideCamera[0].style.justifyContent = 'end' }
        }
    }

    useEffect( () => {

        if (localStream) {
        // if (true) {
            switch (sessionStatus) {
                case 'searching':
                    
                    document.title = "Searching - web app"
                    setSearchParams({status: 'searching'})
                    setChatMessages([])
                    if (isLoadingDisabled !== false) { setIsLoadingDisabled(false) }
                    setLoadingText('Searching match...')
                    setLoadingPaused(false)
                    setChatControlsDisabled(false)
                    partnerId.current = null
                    setUserId(null)
                    
                    const controller = new AbortController()
                    let sessionSettingsPromise
                    if (!window.sessionSettingsPromise) {
                        sessionSettingsPromise = new Promise( (resolve, reject) => { resolve() } )
                    } else {
                        sessionSettingsPromise = window.sessionSettingsPromise
                    }
                    
                    let SearchTimeoutID

                    sessionSettingsPromise.then(() => {
                        fetch('/api/searching', {
                            method: 'GET',
                            signal: controller.signal
                        })
                            .then((response) => {
                                if (!response.ok) {
                                    const json = response.json()
                                    navigate('/home')
                                } else {
                                    
                                    // Conversion tracking
                                    if (!sessionStorage.getItem('first_searching')) {
                                        sessionStorage.setItem('first_searching', true)
                                        trackingEvents.first_searching()
                                    }
                                    trackingEvents.start_searching()

                                    if (playVideoAdRef && playVideoAdRef.current === undefined) {
                                        playVideoAdRef.current = true
                                    }
                    
                                    SearchTimeoutID = setTimeout(() => {
                                        toast.error(<ToastMessage
                                            title={'Low user traffic'}
                                            description={<span>Average wait time for match at this time is <b>-m --s</b>.</span>}
                                        />)
                                    }, 30000)

                                }
                            })
                            .catch((err) => {
                                if (err.code !== 20) {
                                    navigate('/home')
                                }
                            })
                    })

                    return () => {
                        controller.abort()
                        setSecondaryText(null)
                        if (SearchTimeoutID) clearTimeout(SearchTimeoutID)
                    }

                case 'searching_paused':
                    document.title = "Paused - web app"
                    setSearchParams({status: 'paused'})
                    if (isLoadingDisabled !== false) { setIsLoadingDisabled(false) }
                    setLoadingText('Paused')
                    setLoadingPaused(true)
                    searchingAPI.stop()
        
                    break
                case 'connecting':

                    const elem = document.getElementsByClassName('backdrop-blur')
                    if (elem && elem[0]) { elem[0].style.zIndex = '0' }
                    setSessionStatusAfterAd('searching')
                    setLoadingText('Match found...')
                    setSearchParams({status: 'connecting'})
                    setChatControlsDisabled(true)

                    return () => {
                        if (elem && elem[0]) { elem[0].style.zIndex = '-1' }
                    }

                case 'in_session':
                    trackingEvents.start_match()
                    setChatMessages([])
                    setSessionStatusAfterAd('post_session')
                    document.title = "In Session - web app"
                    setSearchParams({status: 'in_session'})
                    if (isLoadingDisabled !== true) { setIsLoadingDisabled(true) }

                    if (!sessionStorage.getItem('first_match')) {
                        sessionStorage.setItem('first_match', true)
                        trackingEvents.first_match()
                    }

                    const in_match_10sTimeoutID = setTimeout(() => {
                        tenSecondMarkRef.current = true
                        trackingEvents.in_match_10s()
                    }, 10000)

                    const in_match_30sTimeoutID = setTimeout(() => {
                        trackingEvents.in_match_30s()
                    }, 30000)

                    const in_match_1mTimeoutID = setTimeout(() => {
                        trackingEvents.in_match_1m()
                    }, 60000)

                    const in_match_5mTimeoutID = setTimeout(() => {
                        trackingEvents.in_match_5m()
                    }, 300000)

                    const in_match_10mTimeoutID = setTimeout(() => {
                        trackingEvents.in_match_10m()
                    }, 600000)


                    const intervalID = setInterval(() => {
                        let localCandidateId
                        let remoteCandidateId
                        peerConnection.current.getStats(null).then((stats) => {   
                            let localCandidateType
                            let remoteCandidateType                     
                            let bytesSent                     
                            let bytesReceived                     
                            stats.forEach((rtcStats) => {
                                if (rtcStats.type === 'candidate-pair' && rtcStats.state === 'succeeded') {
                                    localCandidateId = rtcStats.localCandidateId
                                    remoteCandidateId = rtcStats.remoteCandidateId
                                    bytesSent = rtcStats.bytesSent
                                    bytesReceived = rtcStats.bytesReceived
                                }
                                if (rtcStats.type === "local-candidate" && localCandidateId && rtcStats.id === localCandidateId) {
                                    localCandidateType =  rtcStats.candidateType
                                }
                                if (rtcStats.type === "remote-candidate" && remoteCandidateId && rtcStats.id === remoteCandidateId) {
                                    remoteCandidateType = rtcStats.candidateType
                                }
                            })
                            return {
                                candidates: { localCandidateType: localCandidateType, remoteCandidateType: remoteCandidateType },
                                bytesIO: { bytesSent: bytesSent, bytesReceived: bytesReceived }
                            }
                        }).then((data) => {
                            bytesIO.current = data.bytesIO
                            candidates.current = data.candidates
                            if (data.candidates) {
                                if ([data.candidates.localCandidateType, data.candidates.remoteCandidateType].includes('relay')) {
                                    bandwidthControl(peerConnection.current, 75000, 10000)
                                    // bandwidthControl(peerConnection.current, 'unlimited', 'unlimited')
                                } else {
                                    bandwidthControl(peerConnection.current, 'unlimited', 'unlimited')
                                }
                            }
                        })
                    }, 1000)
                    
                    
                    
                    
                    return () => {
                        if (in_match_10sTimeoutID) { clearTimeout(in_match_10sTimeoutID) }
                        if (in_match_30sTimeoutID) { clearTimeout(in_match_30sTimeoutID) }
                        if (in_match_1mTimeoutID) { clearTimeout(in_match_1mTimeoutID) }
                        if (in_match_5mTimeoutID) { clearTimeout(in_match_5mTimeoutID) }
                        if (in_match_10mTimeoutID) { clearTimeout(in_match_10mTimeoutID) }
                        if (intervalID) { clearInterval(intervalID) }
                        tenSecondMarkRef.current = false
                    }

                case 'post_session':

                    if (peerConnection.current) {
                        peerConnection.current.close()
                        peerConnection.current = null
                    }

                    if (playVideoAdRef && playVideoAdRef.current === undefined) {
                        playVideoAdRef.current = true
                    }
                    document.title = "Disconnected - web app"
                    setSearchParams({status: 'post_session'})
                    setRemoteTrack([])
                    if (isLoadingDisabled !== true) { setIsLoadingDisabled(true) }

                    break
                case 'ad':

                    if (peerConnection.current) {
                        peerConnection.current.close()
                        peerConnection.current = null
                    }

                    if (isLoadingDisabled !== true) { setIsLoadingDisabled(true) }
                    setSearchParams({status: 'ad'})
                    break
                case 'loading':
                    break
                default:
                    console.log(`Invalid sessionStatus: ${sessionStatus}`)
    
                    
            }
        } else {
            toast.error(<ToastMessage
                title={'Camera is turned off'}
                description={'You can not participate in matching without an active camera on you.'}
            />)
            navigate('/home')
        }

    }, [sessionStatus])

    useEffect(() => {

        const webRTC_iceCadidateListener = async (iceCandidate) => {
            if (peerConnection && peerConnection.current ) {
                try {
                    await peerConnection.current.addIceCandidate(iceCandidate)
                } catch (err) {
                    console.log(err)
                }
            }
        }

        const hard_resetListener = () => {
            navigate('/home')
            window.location.reload(false)
        }

        const webRTC_PeerConnectionCloseListener = () => {
            if (peerConnection && peerConnection.current) {
                peerConnection.current.close()
                peerConnection.current = null
            }
        }

        const match_foundListener = async (match, callback) => {
            getIceCredentials().then((credentials) => {
                peerConnection.current = new RTCPeerConnection(credentials)
                setSessionStatus('connecting')
                
                partnerId.current = match.partner_id
                setUserId(match.user_id)
                callback({
                    status: "ok"
                })
            })
        }

        const join_chatListener = (callback) => {
            callback({
                status: "ok"
            })
            setChatControlsDisabled(false)
            setSessionStatus('in_session')
        }

        const searchingListener = () => {
            if (peerConnection.current) {
                peerConnection.current.close()
                peerConnection.current = null
            }
            setSessionStatus('searching')
        }

        const webRTC_answerListener = async (answer, callback) => {
            await peerConnection.current.setRemoteDescription(answer)
            callback('ok')
        }

        const webRTC_initiateListener = async (callback) => {

            socket.on('webRTC_answer', webRTC_answerListener)
            
            addTracks(peerConnection.current)
            addRemoteTracks(peerConnection.current)                            
            handleIceCadidates(peerConnection.current)
            connectionStateChange(peerConnection.current)
            onnegotiationneededListener(peerConnection.current)
            
            let offer = await peerConnection.current.createOffer()
            await peerConnection.current.setLocalDescription(offer)
            callback(offer)

            setLoadingText('Connecting...')
            
        }

        const webRTC_offerListener = async (offer, callback) => {

            peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))

            addTracks(peerConnection.current)
            addRemoteTracks(peerConnection.current)
            handleIceCadidates(peerConnection.current)
            connectionStateChange(peerConnection.current)
            onnegotiationneededListener(peerConnection.current)
            
            
            let answer = await peerConnection.current.createAnswer()
            await peerConnection.current.setLocalDescription(answer)
            callback(answer)
            
            setLoadingText('Connecting...')
            
        }
        
        const messageListener = (message) => {
            updateChatMessages([
                {
                    sender_id: partnerId.current,
                    message
                }
            ])
        }

        const announcementListener = (message) => {
            updateChatMessages([
                {
                    announcement: true,
                    message
                }
            ])
        }

        const in_session_endListener = (ended_by, callback) => {
            if (ended_by && ended_by === partnerId.current && tenSecondMarkRef.current === true) {
                playVideoAdRef.current = true
                setSessionStatus('ad')
                trackingEvents.was_skipped_match()
            } else {
                setSessionStatus('post_session')
                trackingEvents.skip_match()
            }
            callback({
                client_provided_socket_id: socket.id,
                candidates: candidates.current,
                bytesIO: bytesIO.current
            })
        }

        socket.on('webRTC_iceCadidate', webRTC_iceCadidateListener)
        socket.on('hard-reset', hard_resetListener)
        socket.on('webRTC_PeerConnectionClose', webRTC_PeerConnectionCloseListener)
        socket.on('match-found', match_foundListener)
        socket.on('join-chat', join_chatListener)
        socket.on('searching-reset', searchingListener)
        socket.on('webRTC_initiate', webRTC_initiateListener)
        socket.on('webRTC_offer', webRTC_offerListener)
        socket.on('message', messageListener)
        socket.on('announcement', announcementListener)
        socket.on('in_session_end', in_session_endListener)

        return () => {
            
            in_sessionAPI.end({ candidates: candidates.current, bytesIO: bytesIO.current })

            socket.off('announcement', announcementListener)
            socket.off('hard-reset', hard_resetListener)
            socket.off('match-found', match_foundListener)
            socket.off('join-chat', join_chatListener)
            socket.off('searching-reset', searchingListener)
            socket.off('message', messageListener)
            socket.off('in_session_end', in_session_endListener)
            socket.off('webRTC_PeerConnectionClose', webRTC_PeerConnectionCloseListener)
            socket.off('webRTC_iceCadidate', webRTC_iceCadidateListener)
            socket.off('webRTC_answer', webRTC_answerListener)
            socket.off('webRTC_offer', webRTC_offerListener)
            socket.off('webRTC_initiate', webRTC_initiateListener)
        }

    }, [])

    // sessionStatus clean-up
    useEffect( () => {
        return () => {
            switch (sessionStatus) {
                case 'searching':
                    searchingAPI.stop()
                    break
                case 'in_session':
                    if (peerConnection.current) {
                        peerConnection.current.close()
                        peerConnection.current = null
                    }
                    break
                case 'post_session':
                    break
                case 'ad':
                    break
            }
        }
    }, [sessionStatus])
    
    // Update localStream to peerConnection
    useEffect(() => {

        if (peerConnection.current && localStream) {
            const [ videoTrack ] = localStream.getVideoTracks()
            const sender = peerConnection.current.getSenders().find((s) => s.track.kind === videoTrack.kind)
            sender.replaceTrack(videoTrack)
        }

    }, [localStream])
    
    
    useEffect(() => {

        mobileQueryChange(mobileQueryTrigger)

        function handleQueryChange1 (e) {
            setMobileQueryTrigger(e.matches)
            mobileQueryChange(e.matches)
        }
        function handleQueryChange2 (e) {
            setAdQueryTrigger(e.matches)
        }
        
        const mediaQuery1 = window.matchMedia("(max-width: 650px)")
        const mediaQuery2 = window.matchMedia("(max-width: 1200px)")


        mediaQuery1.addEventListener('change', handleQueryChange1)
        mediaQuery2.addEventListener('change', handleQueryChange2)

        return () => {

            if (peerConnection.current) {
                peerConnection.current.close()
                peerConnection.current = null
            }

            mediaQuery1.removeEventListener('change', handleQueryChange1)
            mediaQuery2.removeEventListener('change', handleQueryChange2)

            const topBar = document.getElementById('topBar')
            if (topBar) topBar.style.display = 'block'
            const main = document.getElementById('main')
            if (main) main.style.height = 'calc(100% - (22px + 2rem))'
        }

    }, [])

    return ( 
        <div className="session" id='session'>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            
            <div className="session-cont">
                <div className="camera-side">
                    <div className="camera-side-cont">

                        <RemoteCamera sessionStatus={sessionStatus} setRemoteVideoRefState={setRemoteVideoRefState} remoteTrack={remoteTrack}/>
                        { isLoadingDisabled ? null : <Loading paused={loadingPaused} secondaryText={secondaryText}>{loadingText}</Loading> }
                        { sessionStatus === 'ad' ?
                            
                            <VideoAd
                                setSessionStatus={setSessionStatus}
                                elementId={'VideoAd'}
                                sessionStatusAfterAd={sessionStatusAfterAd}
                                playVideoAdRef={playVideoAdRef}
                                videoAdTimeoutIDRef={videoAdTimeoutIDRef}
                            />
                            :
                            <div className="camera-side-camera" onLoad={mobileQueryChange(mobileQueryTrigger)}>
                                <div className="camera-side-camera-cont">
                                    <Camera
                                        peerConnection={peerConnection.current}
                                    />
                                </div>
                            </div>
                        }

                    </div>
                </div>

                <div className="chat-side">
                    <div className="chat-side-cont">

                        { !mobileQueryTrigger && process.env.REACT_APP_CHAT_AD_ENABLED.toLowerCase() === 'true' ? <AboveChatAdBanner/> : null }

                        <Chat
                            chatStatus={sessionStatus}
                            partnerId={partnerId.current}
                            userId={userId}
                            chatMessages={chatMessages}
                            updateChatMessages={updateChatMessages}
                            setSessionStatus={setSessionStatus}
                            isLoadingDisabled={isLoadingDisabled}
                            chatControlsDisabled={chatControlsDisabled}
                            allowVideoAd={allowVideoAd}
                            firstMatch={firstMatch}
                            setFirstMatch={setFirstMatch}
                            skipButtonText={skipButtonText}
                            skipButtonDisabled={skipButtonDisabled}
                            sessionStatusAfterAd={sessionStatusAfterAd}
                            setSessionStatusAfterAd={setSessionStatusAfterAd}
                            playVideoAdRef={playVideoAdRef}
                            candidates={candidates}
                            bytesIO={bytesIO}
                        />

                         
                    </div>
                </div>
            </div>

        </div>
     )
}

export default Session