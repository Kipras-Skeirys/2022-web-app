import { Helmet } from 'react-helmet'
import SessionSetup from './SessionSettings'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function Home() {

    const location = useLocation()

    useEffect(() => {
        document.title = "Home - web app"
    }, [])

    return ( 
        <div className="home">
            <Helmet>
                <link rel="canonical" href={`https://demo.com${location.pathname}`} />
            </Helmet>
            <div className="home-cont">
                <SessionSetup />
            </div>
        </div>
     )
}

export default Home