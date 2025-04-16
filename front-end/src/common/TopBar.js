import { Link, useLocation } from "react-router-dom"
import { useEffect, useState, useRef } from 'react'
import socket from '../api/socket'

function TopBar() {

    let location = useLocation()

    const [ userCount, setUserCount ] = useState('-')
    const [ showOnlineUsers, setShowOnlineUsers ] = useState(true)
    const navBarRef = useRef()

    useEffect(() => {

        const userCountUpdateListener = (userCount) => {
            setUserCount(userCount)
        }

        if (location.pathname === '/come-back-later') {
            setShowOnlineUsers(false)
        } else {
            setShowOnlineUsers(true)
            socket.emit('getUserCountUpdate', (userCount) => {
                if (!userCount) {
                    return
                } else {
                    setUserCount(userCount)
                }
            })
            socket.on('userCountUpdate', userCountUpdateListener)
        }

        return () => {
            socket.off('userCountUpdate', userCountUpdateListener)
        }
        
    })

    function handleNavBar(action) {
        switch(action) {
            case 'toggle':
                navBarRef.current.style.display === 'block' ? navBarRef.current.style.display = 'none' : navBarRef.current.style.display = 'block'
                break
            case 'open':
                navBarRef.current.style.display = 'block'
                break
            case 'close':
                navBarRef.current.style.display = 'none'
                break
        }
    }

    return (
        <header className="topBar" id="topBar" onMouseLeave={() => { handleNavBar('close') }}>
            <div className="topBar-cont">
                <div className="topBar-align-left">
                    <Link to='/home' className='logo-container' aria-label="Go home" >
                        <svg className="logo" xmlns="http://www.w3.org/2000/svg" data-name="Layer 2" width="134.034" height="16" viewBox="0 0 134.034 16"> <path d="M777.28,17.78h2a3.37,3.37,0,0,1,1.73.347,1.175,1.175,0,0,1,.567,1.08,1.368,1.368,0,0,1-.247.823,1.1,1.1,0,0,1-.65.432V20.5a1.331,1.331,0,0,1,.776.481,1.419,1.419,0,0,1,.239.855,1.465,1.465,0,0,1-.585,1.23,2.566,2.566,0,0,1-1.6.45h-2.23Zm1.545,2.194h.467a.845.845,0,0,0,.515-.137.477.477,0,0,0,.183-.408q0-.483-.729-.483h-.432Zm0,1.133v1.2h.545c.484,0,.721-.2.721-.611a.529.529,0,0,0-.193-.432.894.894,0,0,0-.564-.153Z" transform="translate(-665.24 -15.217)" fill="#e2003b" /> <path d="M818.213,23.513h-3.4V17.78h3.4v1.243H816.36v.9h1.717v1.243H816.36V22.25h1.854Z" transform="translate(-697.36 -15.217)" fill="#e2003b" /> <path d="M845.419,23.513H843.87V19.044h-1.4V17.78h4.344v1.267h-1.4Z" transform="translate(-721.033 -15.217)" fill="#e2003b" /> <path d="M878.135,23.376l-.288-1.075h-1.855l-.288,1.075H874l1.874-5.756h2.067l1.893,5.756Zm-.6-2.345-.246-.941q-.086-.314-.209-.812c-.084-.332-.144-.569-.163-.714-.024.134-.071.353-.144.659s-.222.908-.46,1.808Z" transform="translate(-748.018 -15.08)" fill="#e2003b" /> <path d="M778.752,11.872h-19.4a2.792,2.792,0,0,1-2.789-2.789V4.029a2.792,2.792,0,0,1,2.789-2.789h19.4a2.792,2.792,0,0,1,2.788,2.789V9.083a2.792,2.792,0,0,1-2.788,2.789Zm-19.4-9.963a2.123,2.123,0,0,0-2.12,2.12V9.083a2.122,2.122,0,0,0,2.12,2.119h19.4a2.122,2.122,0,0,0,2.119-2.119V4.029a2.123,2.123,0,0,0-2.119-2.12Z" transform="translate(-647.506 -1.061)" fill="#e2003b" /> <path d="M0,16.652V.91H3.707c2.505,0,3.827,1.349,3.827,3.9V6.488c0,2.566-1.348,3.813-4.123,3.813H1.433v6.351ZM3.412,9.07c1.91,0,2.691-.729,2.691-2.515V4.746c0-1.8-.739-2.6-2.4-2.6H1.433V9.07Z" transform="translate(0 -0.779)" fill="#fff" /> <path d="M74.788,16.652a2.958,2.958,0,0,1-.52-2.005V12.222c0-1.757-.886-2.474-3.057-2.474H69.573v6.9H68.14V.91h3.728c2.54,0,3.827,1.224,3.827,3.638V5.892a2.99,2.99,0,0,1-2.037,3.2,2.977,2.977,0,0,1,2.037,3.154v2.4a3.05,3.05,0,0,0,.389,1.763l.176.242ZM71.235,8.519c1.874,0,3.027-.408,3.027-2.429V4.636c0-1.7-.768-2.494-2.419-2.494h-2.27V8.519Z" transform="translate(-58.318 -0.779)" fill="#fff" /> <path d="M143.081,16c-2.479,0-3.9-1.479-3.9-4.056V4.055c0-2.577,1.415-4.055,3.9-4.055,2.514,0,3.952,1.477,3.952,4.055V11.95C147.033,14.527,145.594,16,143.081,16Zm0-14.775c-2.04,0-2.468,1.5-2.468,2.757v8.033c0,1.257.432,2.759,2.468,2.759,2.083,0,2.521-1.5,2.521-2.759V3.988c0-1.258-.438-2.757-2.521-2.757Z" transform="translate(-119.118)" fill="#fff" /> <path d="M209.271,16.669c-.19,0-.383,0-.577-.017l-.144-.007V15.411s.355.017.45.017c.238,0,.473-.014.7-.029,1.6-.11,2.283-.9,2.283-2.628V.91h1.433v11.8c0,2.553-1.169,3.843-3.576,3.945C209.647,16.664,209.46,16.669,209.271,16.669Z" transform="translate(-178.489 -0.779)" fill="#fff" /> <path d="M259.32,16.652V.91h7.069V2.142h-5.637V8.055h4.68V9.288h-4.68v6.133h5.637v1.231Z" transform="translate(-221.941 -0.779)" fill="#fff" /> <path d="M328.253,16c-2.45,0-3.853-1.479-3.853-4.056V4.055C324.4,1.477,325.8,0,328.253,0s3.853,1.477,3.853,4.055V5.486h-1.382v-1.5c0-1.258-.425-2.757-2.45-2.757s-2.45,1.5-2.45,2.757v8.027c0,1.248.424,2.739,2.45,2.739s2.45-1.488,2.45-2.739V10.034h1.382V11.95C332.106,14.527,330.7,16,328.253,16Z" transform="translate(-277.64)" fill="#fff" /> <path d="M393.818,16.652V2.142H390.34V.91h8.415V2.142h-3.5v14.51Z" transform="translate(-334.075 -0.779)" fill="#fff" /> <path d="M484.767,8.5v2.205h-3.7v4.52h4.656v2.205H478.37V2h7.351V4.205h-4.656V8.5Z" transform="translate(-409.416 -1.712)" fill="#fff" /> <path d="M546.3,15.538V13.112c0-1.441-.541-1.963-1.764-1.963h-.931v6.285h-2.7V2h4.068c2.792,0,3.993,1.169,3.993,3.55V6.757a3.019,3.019,0,0,1-1.764,3.132c1.356.51,1.789,1.678,1.789,3.288v2.381a4.193,4.193,0,0,0,.288,1.874h-2.739A4.356,4.356,0,0,1,546.3,15.538Zm-2.7-6.595h1.054c1.009,0,1.616-.4,1.616-1.632V5.79c0-1.1-.415-1.586-1.371-1.586h-1.3Z" transform="translate(-462.941 -1.712)" fill="#fff" /> <path d="M611.782.76c2.646,0,4.092,1.411,4.092,3.88v8.027c0,2.469-1.441,3.882-4.092,3.882s-4.092-1.413-4.092-3.882V4.64C607.69,2.171,609.136.76,611.782.76Zm0,13.584c.858,0,1.4-.419,1.4-1.522V4.486c0-1.1-.539-1.521-1.4-1.521s-1.4.418-1.4,1.521v8.336C610.385,13.925,610.925,14.344,611.782,14.344Z" transform="translate(-520.095 -0.65)" fill="#fff" /> <path d="M677.672.76c2.622,0,3.97,1.411,3.97,3.88v.486h-2.547v-.64c0-1.1-.492-1.521-1.349-1.521s-1.348.418-1.348,1.521c0,3.171,5.27,3.771,5.27,8.182,0,2.469-1.374,3.882-4.019,3.882s-4.019-1.413-4.019-3.882v-.948h2.547v1.1c0,1.1.539,1.5,1.4,1.5s1.4-.4,1.4-1.5c0-3.171-5.268-3.771-5.268-8.182C673.7,2.171,675.05.76,677.672.76Z" transform="translate(-576.53 -0.65)" fill="#fff" /> </svg>
                    </Link>
                    <div className="expandable-nav-bar-cont">
                        <button className="expand-nav-bar-button" aria-label="Expand navigation bar" onClick={() => { handleNavBar('toggle') }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512"><path d="M64 360a56 56 0 100 112 56 56 0 100-112zm0-160a56 56 0 100 112 56 56 0 100-112zm56-104A56 56 0 108 96a56 56 0 10112 0z"></path></svg>
                        </button>
                        <nav className="expandable-nav-bar" ref={navBarRef}>
                            <ul>
                                <li><a className="" href={'https://about.' + window.location.host}>About</a></li>
                                <li><a href={'https://help.' + window.location.host + '/faq'}>FAQ</a></li>
                                <li><a href={'https://help.' + window.location.host + '/contact'}>Cantact Us</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
                <div className="topBar-align-right">
                    <div className="onlineUsers-cont" style={{display: showOnlineUsers ? 'block' : 'none'}}>
                        <span style={{fontWeight: 500, color: 'gray'}}>Online Users: <b style={{fontWeight: 600, color: 'white'}}>{userCount}</b></span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default TopBar