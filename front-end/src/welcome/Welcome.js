import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import trackingEvents from '../utils/trackingEvents'

function Welcome() {

    let navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname

    // Refs
    const readMoreRef = useRef()

    // State
    const [ helmetContent, setHelmetContent ] = useState()
    const [ welcomeText, setWelcomeText ] = useState('Video chat web app')
    const [ readMoreContent, setReadMoreContent ] = useState()

    useEffect(() => {

        
        switch(currentPath) {
            case '/welcome':
                setHelmetContent(
                    <Helmet>
                        <link rel="canonical" href={`https://demo.com${location.pathname}`} />
                        <title>web app - video chat web app</title>
                        <meta name="description" content="" />
                    </Helmet>
                )
                setWelcomeText('')
                setReadMoreContent('')
                break
        }

    }, [currentPath])

    useEffect(() => {

        const videoElem = document.querySelectorAll('.carousel-video')

        const intervalID = setInterval(() => {
            videoElem.forEach((video) => {
                if (video.paused) {
                    video.play()
                }
            })
        }, [1000])
        if (!sessionStorage.getItem('analytics_consent')) sessionStorage.setItem('analytics_consent', true)
        if (!sessionStorage.getItem('marketing_consent')) sessionStorage.setItem('marketing_consent', true)

        return () => {
            if (intervalID) clearInterval(intervalID)
        }

    }, [])

    useEffect(() => {
        if (sessionStorage.getItem('tracking_consent') === 'true'){
            navigate('/home')
        }
    })

    function handleClick(e) {
        e.preventDefault()
        if (e.target.name === 'accept') {
            sessionStorage.setItem('tracking_consent', 'true')
            trackingEvents.tracking_consent()
            navigate('/home')
        }else if (e.target.name === 'customize') {
            navigate(`/${'welcome'}/privacy`)
            window.scrollTo(0,0)
        }
    }

    function toggleReadMore(e) {
        if (readMoreRef.current.style.display === 'none') {
            readMoreRef.current.style.display = 'flex'
            e.target.querySelector('svg').style.transform = 'rotate(180deg)'
            e.target.querySelector('span').textContent = 'Collapse'
        } else {
            readMoreRef.current.style.display = 'none'
            e.target.querySelector('svg').style.transform = 'rotate(0deg)'
            e.target.querySelector('span').textContent = 'Read more'
        }
    }

    return (
        <div className="welcome">
            {helmetContent}
            <div className="welcome-cont">

                <div className="carousel-cont">
                    <div className="carousel">
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/g-1.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sw-2.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sm-2.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/l-1.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sm-3.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sw-1.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/g-1.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/l-2.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sm-1.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sw-3.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/g-1.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sw-2.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/sm-2.mp4`}></video></div>
                        <div className="carousel-media"> <video className='carousel-video' width="200" height="200" type="video/mp4" autoPlay playsInline muted loop src={`${process.env.REACT_APP_PUBLIC_URL}/assets/video/l-1.mp4`}></video></div>
                    </div>
                    <div className="carousel-fade-overlay carousel-start"></div>
                    <div className="carousel-fade-overlay carousel-end"></div>
                </div>
                
                <h1 className="welcome-title big-bold">Welcome to web app</h1>
                <h2 className="welcome-text med-regular">{welcomeText}</h2>
                <div className="welcome-read-more-button" onClick={(e) => toggleReadMore(e)}>
                    <span>Read more</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M201.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 274.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>
                </div>
                <div className="welcome-read-more" ref={readMoreRef} style={{display: 'none'}}>
                    <span className="welcome-read-more-text sml-regular gray">{readMoreContent}</span>
                </div>
                <div className="welcome-privacy">
                    <h1 className="welcome-privacy-title">Privacy.</h1>
                    <span className="welcome-privacy-text sml-regular gray">By continuing you agree with our <a href="https://legal.demo.com/terms" target="_blank" rel="noopener noreferrer">Terms Of Service</a> and <a href="https://legal.demo.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and usage of <a href="https://legal.demo.com/data"  target="_blank" rel="noopener noreferrer">Cookies And Data</a>.</span>
                    <div className="welcome-button-cont">
                        <button type="button" name="customize" className="welcome-btn btn-red" onClick={(e) => handleClick(e)}>Customize</button>
                        <button type="button" name="accept" className="welcome-btn btn-red" onClick={(e) => handleClick(e)}>Agree & Continue</button>
                    </div>
                </div>
            </div>
        </div>
     )
}

export default Welcome