import { useRef, useState, useId } from 'react'

function LoadingBottom(props) {

    // Props
    const logo = props.logo
    const text = props.children

    let element

    if (logo === true) {
        element = <svg xmlns="http://www.w3.org/2000/svg" width="134.034" height="16" viewBox="0 0 134.034 16" > <path fill="#e2003b" d="M112.04 2.563h2a3.37 3.37 0 011.73.347 1.175 1.175 0 01.567 1.08 1.368 1.368 0 01-.247.823 1.1 1.1 0 01-.65.432v.038a1.331 1.331 0 01.776.481 1.419 1.419 0 01.239.855 1.465 1.465 0 01-.585 1.23 2.566 2.566 0 01-1.6.45h-2.23zm1.545 2.194h.467a.845.845 0 00.515-.137.477.477 0 00.183-.408q0-.483-.729-.483h-.432zm0 1.133v1.2h.545c.484 0 .721-.2.721-.611a.529.529 0 00-.193-.432.894.894 0 00-.564-.153zM120.853 8.296h-3.4V2.563h3.4v1.243H119v.9h1.717v1.243H119v1.084h1.854zM124.386 8.296h-1.549V3.827h-1.4V2.563h4.344V3.83h-1.4zM130.117 8.296l-.288-1.075h-1.855l-.288 1.075h-1.704l1.874-5.756h2.067l1.893 5.756zm-.6-2.345l-.246-.941q-.086-.314-.209-.812c-.084-.332-.144-.569-.163-.714-.024.134-.071.353-.144.659s-.222.908-.46 1.808z" ></path> <path fill="#e2003b" d="M131.246 10.811h-19.4a2.792 2.792 0 01-2.789-2.789V2.968a2.792 2.792 0 012.789-2.789h19.4a2.792 2.792 0 012.788 2.789v5.054a2.792 2.792 0 01-2.788 2.789zm-19.4-9.963a2.123 2.123 0 00-2.12 2.12v5.054a2.122 2.122 0 002.12 2.119h19.4a2.122 2.122 0 002.119-2.119V2.968a2.123 2.123 0 00-2.119-2.12z" ></path> <path fill="#fff" d="M0 15.873V.131h3.707c2.505 0 3.827 1.349 3.827 3.9v1.678c0 2.566-1.348 3.813-4.123 3.813H1.433v6.351zm3.412-7.582c1.91 0 2.691-.729 2.691-2.515V3.967c0-1.8-.739-2.6-2.4-2.6h-2.27v6.924zM16.47 15.873a2.958 2.958 0 01-.52-2.005v-2.425c0-1.757-.886-2.474-3.057-2.474h-1.638v6.9H9.822V.131h3.728c2.54 0 3.827 1.224 3.827 3.638v1.344a2.99 2.99 0 01-2.037 3.2 2.977 2.977 0 012.037 3.154v2.4a3.05 3.05 0 00.389 1.763l.176.242zM12.917 7.74c1.874 0 3.027-.408 3.027-2.429V3.857c0-1.7-.768-2.494-2.419-2.494h-2.27V7.74zM23.963 16c-2.479 0-3.9-1.479-3.9-4.056V4.055c0-2.577 1.415-4.055 3.9-4.055 2.514 0 3.952 1.477 3.952 4.055v7.895c0 2.577-1.439 4.05-3.952 4.05zm0-14.775c-2.04 0-2.468 1.5-2.468 2.757v8.033c0 1.257.432 2.759 2.468 2.759 2.083 0 2.521-1.5 2.521-2.759V3.988c0-1.258-.438-2.757-2.521-2.757zM30.782 15.89c-.19 0-.383 0-.577-.017l-.144-.007v-1.234s.355.017.45.017c.238 0 .473-.014.7-.029 1.6-.11 2.283-.9 2.283-2.628V.131h1.433v11.8c0 2.553-1.169 3.843-3.576 3.945-.193.009-.38.014-.569.014zM37.379 15.873V.131h7.069v1.232h-5.637v5.913h4.68v1.233h-4.68v6.133h5.637v1.231zM50.613 16c-2.45 0-3.853-1.479-3.853-4.056V4.055C46.76 1.477 48.16 0 50.613 0s3.853 1.477 3.853 4.055v1.431h-1.382v-1.5c0-1.258-.425-2.757-2.45-2.757s-2.45 1.5-2.45 2.757v8.027c0 1.248.424 2.739 2.45 2.739s2.45-1.488 2.45-2.739v-1.979h1.382v1.916c0 2.577-1.406 4.05-3.853 4.05zM59.743 15.873V1.363h-3.478V.131h8.415v1.232h-3.5v14.51zM75.351 6.788v2.205h-3.7v4.52h4.656v2.205h-7.353V.288h7.351v2.205h-4.656v4.295zM83.359 13.826V11.4c0-1.441-.541-1.963-1.764-1.963h-.931v6.285h-2.7V.288h4.068c2.792 0 3.993 1.169 3.993 3.55v1.207a3.019 3.019 0 01-1.764 3.132c1.356.51 1.789 1.678 1.789 3.288v2.381a4.193 4.193 0 00.288 1.874h-2.739a4.356 4.356 0 01-.24-1.894zm-2.7-6.595h1.054c1.009 0 1.616-.4 1.616-1.632V4.078c0-1.1-.415-1.586-1.371-1.586h-1.3zM91.687.11c2.646 0 4.092 1.411 4.092 3.88v8.027c0 2.469-1.441 3.882-4.092 3.882s-4.092-1.413-4.092-3.882V3.99c0-2.469 1.446-3.88 4.092-3.88zm0 13.584c.858 0 1.4-.419 1.4-1.522V3.836c0-1.1-.539-1.521-1.4-1.521s-1.4.418-1.4 1.521v8.336c.003 1.103.543 1.522 1.4 1.522zM101.142.11c2.622 0 3.97 1.411 3.97 3.88v.486h-2.547v-.64c0-1.1-.492-1.521-1.349-1.521s-1.348.418-1.348 1.521c0 3.171 5.27 3.771 5.27 8.182 0 2.469-1.374 3.882-4.019 3.882S97.1 14.487 97.1 12.018v-.948h2.547v1.1c0 1.1.539 1.5 1.4 1.5s1.4-.4 1.4-1.5c0-3.171-5.268-3.771-5.268-8.182C97.17 1.521 98.52.11 101.142.11z" ></path> </svg>
    } else if (text) {
        element = <span className="med-semibold">{text}</span>
    } else {
        return null
    }

    return (
        <div className="loading-bottom">
            {element}
        </div>
    )
}

function Loading(props) {

    // Props
    const paused = props.paused
    const secondaryText = props.secondaryText
    const theme = props.theme

    // Hooks
    const loadingRef = useRef()

    // State
    const [secondaryTextClose, setSecondaryTextClose] = useState(false)

    // Variables
    const uniqueId = useId()

    let colorAccentOne = '#e2003b'
    let colorAccentTwo = '#f1465f'
    
    if (theme) {
        switch (theme) {
            case 'default':
                colorAccentOne = '#e2003b'
                colorAccentTwo = '#f1465f'
                break
            case 'dark-blue':
                colorAccentOne = '#0E141B'
                colorAccentTwo = '#13212C'
                break
            case 'gray':
                colorAccentOne = '#4A4A4A'
                colorAccentTwo = '#6B6B6B'
                break
        }
    }

    if (paused && loadingRef.current) {
        loadingRef.current.style.animationPlayState = 'paused'
        loadingRef.current.style.filter = 'grayscale(1)'
    } else if (loadingRef.current) {
        loadingRef.current.style.animationPlayState = 'running'
        loadingRef.current.style.filter = 'grayscale(0)'
    }

    function handleDismiss() {
        setSecondaryTextClose(true)
        // Remove in the future
        sessionStorage.setItem('long_search_notice', true)
    }

    return (
        <div className="loading-cont">
            <div className="loading">
                <svg ref={loadingRef} className="loading-icon" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" data-name="Layer 1" viewBox="0 0 44 44">
                    <defs>
                        <linearGradient id={"linear-gradient"+uniqueId} x1="0.34" x2="43.67" y1="5.5" y2="5.5" gradientTransform="translate(-.08 .06)" gradientUnits="userSpaceOnUse">
                            <stop offset="0.01" stopColor={colorAccentOne}></stop>
                            <stop offset="1" stopColor={colorAccentTwo}></stop>
                        </linearGradient>
                        <linearGradient id={"linear-gradient-2"+uniqueId} x1="0.34" x2="43.67" y1="38.5" y2="38.5" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-3"+uniqueId} x1="0.34" x2="43.67" y1="22" y2="22" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-5"+uniqueId} x1="0.34" x2="43.67" y1="13.75" y2="13.75" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-6"+uniqueId} x1="0.34" x2="43.67" y1="30.25" y2="30.25" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-7"+uniqueId} x1="0.34" x2="43.67" y1="36.29" y2="36.29" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-8"+uniqueId} x1="0.34" x2="43.67" y1="7.71" y2="7.71" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-10"+uniqueId} x1="0.34" x2="43.67" y1="30.25" y2="30.25" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-11"+uniqueId} x1="0.34" x2="43.67" y1="7.71" y2="7.71" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                        <linearGradient id={"linear-gradient-12"+uniqueId} x1="0.34" x2="43.67" y1="36.29" y2="36.29" xlinkHref={"#linear-gradient"+uniqueId}></linearGradient>
                    </defs>
                    <g data-name="Group 66">
                        <path fill={`url(#linear-gradient${uniqueId})`} d="M22 11a2 2 0 01-2-2V2a2 2 0 114 0v7a2 2 0 01-2 2z" data-name="Line 25"></path>
                        <path fill={`url(#linear-gradient-2${uniqueId})`} d="M22 44a2 2 0 01-2-2v-7a2 2 0 014 0v7a2 2 0 01-2 2z" data-name="Line 26"></path>
                        <path fill={`url(#linear-gradient-3${uniqueId})`} d="M42 24h-7a2 2 0 010-4h7a2 2 0 010 4z" data-name="Line 27"></path>
                        <path fill={`url(#linear-gradient-3${uniqueId})`} d="M9 24H2a2 2 0 110-4h7a2 2 0 010 4z" data-name="Line 34"></path>
                        <path fill={`url(#linear-gradient-5${uniqueId})`} d="M33.25 17.49a2 2 0 01-1.73-1 2 2 0 01.73-2.73l6.06-3.5a2 2 0 112 3.47l-6.06 3.5a2 2 0 01-1 .26z" data-name="Line 28"></path>
                        <path fill={`url(#linear-gradient-6${uniqueId})`} d="M4.67 34a2 2 0 01-1.73-1 2 2 0 01.73-2.73l6.06-3.5a2 2 0 112 3.47l-6.06 3.5a2 2 0 01-1 .26z" data-name="Line 35"></path>
                        <path fill={`url(#linear-gradient-7${uniqueId})`} d="M32 41.31a2 2 0 01-1.74-1l-3.5-6.06a2 2 0 013.47-2l3.5 6.06a2 2 0 01-.73 2.74 2 2 0 01-1 .26z" data-name="Line 29"></path>
                        <path fill={`url(#linear-gradient-8${uniqueId})`} d="M15.5 12.74a2 2 0 01-1.74-1l-3.5-6.06a2 2 0 013.47-2l3.5 6.06a2 2 0 01-1.73 3z" data-name="Line 30"></path>
                        <path fill={`url(#linear-gradient-5${uniqueId})`} d="M10.73 17.49a2 2 0 01-1-.26l-6.06-3.5a2 2 0 012-3.47l6.06 3.5a2 2 0 01-1 3.73z" data-name="Line 36"></path>
                        <path fill={`url(#linear-gradient-10${uniqueId})`} d="M39.31 34a2 2 0 01-1-.26l-6.06-3.5a2 2 0 012-3.47l6.06 3.5a2 2 0 01-1 3.73z" data-name="Line 31"></path>
                        <path fill={`url(#linear-gradient-11${uniqueId})`} d="M28.49 12.74a2 2 0 01-1.73-3l3.5-6.06a2 2 0 013.47 2l-3.5 6.06a2 2 0 01-1.74 1z" data-name="Line 32"></path>
                        <path fill={`url(#linear-gradient-12${uniqueId})`} d="M12 41.31a2 2 0 01-1.73-3l3.5-6.06a2 2 0 013.47 2l-3.5 6.06a2 2 0 01-1.74 1z" data-name="Line 33"></path>
                    </g>
                </svg>
                <LoadingBottom {...props} />
                {secondaryText && !secondaryTextClose ?
                    <div className="loading-secondaryText">
                        <span>{secondaryText}<a onClick={handleDismiss}><br></br> Dismiss</a></span>
                    </div>
                    :
                    null
                }
            </div>
        </div>
    )
}

export default Loading