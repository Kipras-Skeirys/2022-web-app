import { useEffect, useRef } from 'react'
import fluidPlayer from 'fluid-player';
import Loading from '../common/Loading'
import trackingEvents from '../utils/trackingEvents'

function VideoAd(props) {

    // Props
    const setSessionStatus = props.setSessionStatus
    const elementId = props.elementId
    const sessionStatusAfterAd = props.sessionStatusAfterAd
    const playVideoAdRef = props.playVideoAdRef
    const videoAdTimeoutIDRef = props.videoAdTimeoutIDRef

    const playerRef = useRef()
    const videoRef = useRef()
    const VideoAdRef = useRef()
    const playButtonContRef = useRef()
    
    function handlePlayButton() {
        if (videoRef.current.paused) {
            playerRef.current.play()
        }
    }
    
    useEffect(() => {
        
        if (playerRef && !playerRef.current) {
            const video = document.createElement('video')
            video.id = 'VideoAd-video'
            video.className = 'VideoAd-video'
            video.style.width = '100%'
            video.style.height = '100%'
            video.style.visibility = 'hidden'
            video.playsInline = true
            document.getElementById(elementId).appendChild(video)
        
            let failed_video_ad_triggered = false
            let start_video_ad_triggered = false

            videoRef.current = video
        
            playerRef.current = fluidPlayer('VideoAd-video', {
                vastOptions: {
                    adList: [
                        {
                            roll: 'preRoll',
                            vastTag: `https://vast.yomeno.xyz/vast?spot_id=${process.env.REACT_APP_IN_VIDEO_AD_VAST_ID}`
                            // vastTag: `https://vast.yomeno.xyz/vast?spot_id=`
                        }
                    ],
                    adClickable: true,
                    vastAdvanced: {
                        noVastVideoCallback: (function() {
                            playerRef.current.on('playing', function(){
                                setTimeout(() => {
                                    playerRef.current.pause()
                                }, 0)
                                playerRef.current.on('pause', function(){
                                    videoAdTimeoutIDRef.current = setTimeout(() => {
                                        playVideoAdRef.current = true
                                    }, process.env.REACT_APP_VIDEO_AD_INTERVAL / 3)
                                    playVideoAdRef.current = false
                                    playerRef.current.destroy()
                                    setSessionStatus(sessionStatusAfterAd)
                                })
                            })
                        }),
                        vastLoadedCallback: (function() {
                            video.style.visibility = 'visible'
                            VideoAdRef.current.style.visibility = 'visible'
                            playerRef.current.on('play', function() {
                                if (playButtonContRef && playButtonContRef.current && playButtonContRef.current.style.display === 'flex') {
                                    playButtonContRef.current.style.display = 'none'
                                }
                            })
                
                            playerRef.current.on('pause', function() {
                                if (playButtonContRef && playButtonContRef.current && playButtonContRef.current.style.display === 'none') {
                                    playButtonContRef.current.style.display = 'flex'
                                }
                            })
                        }),
                        vastVideoSkippedCallback: (function() {
                        }),
                        vastVideoEndedCallback: (function() {
                            if (videoAdTimeoutIDRef && videoAdTimeoutIDRef.current) {
                                clearTimeout(videoAdTimeoutIDRef.current)
                                videoAdTimeoutIDRef.current = null
                            }
        
                            videoAdTimeoutIDRef.current = setTimeout(() => {
                                playVideoAdRef.current = true
                            }, process.env.REACT_APP_VIDEO_AD_INTERVAL)
                            playVideoAdRef.current = false
                            setSessionStatus(sessionStatusAfterAd)
                        })
                    }
                },
                layoutControls: {
                    playButtonShowing: false,
                    playPauseAnimation: false,
                    allowTheatre: false,
                    doubleclickFullscreen: false
                }
            })

            playerRef.current.play()
            
            const playInterval = setInterval(() => {
                if (videoRef.current.currentTime > 0 && !videoRef.current.paused && !videoRef.current.ended && videoRef.current.readyState > 2) {
                    clearInterval(playInterval)
                } else {
                    playerRef.current.play()
                }
            }, 1000)

            function handleVideoAdError() {
                if (videoAdTimeoutIDRef && videoAdTimeoutIDRef.current) {
                    clearTimeout(videoAdTimeoutIDRef.current)
                    videoAdTimeoutIDRef.current = null
                }
                videoAdTimeoutIDRef.current = setTimeout(() => {
                    playVideoAdRef.current = true
                }, process.env.REACT_APP_VIDEO_AD_INTERVAL / 3)
                playVideoAdRef.current = false
                setSessionStatus(sessionStatusAfterAd)
                if (!failed_video_ad_triggered) {
                    trackingEvents.failed_video_ad()
                    failed_video_ad_triggered = true
                    console.log('VideoAd FAILED');
                }
            }

            function handleVideoAdSuccess() {
                if (!start_video_ad_triggered) {
                    trackingEvents.start_video_ad()
                    start_video_ad_triggered = true
                    console.log('VideoAd START');
                }
            }

            video.addEventListener('error', handleVideoAdError)
            video.addEventListener('playing', handleVideoAdSuccess)

            return () => {
                playerRef.current.destroy()
                clearInterval(playInterval)
                video.removeEventListener('error', handleVideoAdError)
                video.removeEventListener('playing', handleVideoAdSuccess)
                if (!failed_video_ad_triggered && !start_video_ad_triggered) {
                    // In case when the the error occurs after unmount
                    trackingEvents.failed_video_ad()
                    failed_video_ad_triggered = true
                    console.log('VideoAd FAILED2');
                }
            }
        }

        
    }, [])

    return (
        <>
            <Loading>Loading ad...</Loading>
            <div className="VideoAd-cont">
                <div className="VideoAd" id={elementId} ref={VideoAdRef} style={ {visibility: 'hidden'} }/>
                <div className="playButton-cont" ref={playButtonContRef} style={ {display: 'none'} }>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className='playButton-svg' onClick={handlePlayButton}>
                        <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80v352c0 17.4 9.4 33.4 24.5 41.9S58.2 482 73 473l288-176c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"></path>
                    </svg>
                </div>
            </div>
        </>
    )
}

export default VideoAd