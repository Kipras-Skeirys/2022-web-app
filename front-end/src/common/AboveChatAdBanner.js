import { useEffect, useState, useRef } from 'react'

function AboveChatAdBanner() {

    // Hooks
    const [ ad, setAd ] = useState()

    // Refs
    const bannerRef = useRef()

    function loadDesktopChatBanner(callback) {

        const desktopChatBannerIframe = document.getElementById('desktopChatBannerIframe')

        if (!desktopChatBannerIframe) {
            // Create iframe
            const iframe = document.createElement('iframe')
            iframe.id = 'desktopChatBannerIframe'
            document.getElementById('chat-side-ad').appendChild(iframe)
            // iframe style
            iframe.style.width = '300px'
            iframe.style.height = '250px'
            iframe.contentWindow.document.documentElement.style.backgroundColor = '#13212C'
            iframe.contentWindow.document.body.style.overflow = 'hidden'
            iframe.contentWindow.document.body.style.margin = '0px'     
                        
            // Add banner element
            const div = document.createElement('div')
            div.setAttribute('data-clickadilla-banner', process.env.REACT_APP_CHAT_AD_ID)
            div.id = 'aboveChatBanner'
            iframe.contentWindow.document.body.appendChild(div)

            // Create script
            const script = document.createElement('script')
            script.src = 'https://js.wpadmngr.com/static/adManager.js'
            script.id = 'desktopChatBannerScript'
            script.setAttribute('data-admpid', process.env.REACT_APP_CHAT_AD_TAG_ID)
            script.setAttribute('async', '')
            iframe.contentWindow.document.body.appendChild(script)
            
            script.onload = () => { 
                if (callback) callback(iframe)
            }
        }

        if (desktopChatBannerIframe && callback) callback(desktopChatBannerIframe)

    }

    useEffect(() => {
        bannerRef.current.style.height = '0'
        bannerRef.current.style.marginBottom = '0'
        bannerRef.current.style.overflow = 'hidden'
        loadDesktopChatBanner((iframe) => {

            setAd(iframe)

            const banner = iframe.contentWindow.document.getElementById('aboveChatBanner')
            if (!banner.innerHTML) {
                bannerRef.current.style.height = '0'
                bannerRef.current.style.marginBottom = '0'
                bannerRef.current.style.overflow = 'hidden'
            }
            const observer = new MutationObserver(function(mutations) {
                if (!banner.innerHTML) {
                    bannerRef.current.style.height = '0'
                    bannerRef.current.style.marginBottom = '0'
                    bannerRef.current.style.overflow = 'hidden'
                } else {
                    bannerRef.current.style.height = 'auto'
                    bannerRef.current.style.marginBottom = '0.5rem'
                    bannerRef.current.style.overflow = 'visible'
                }
            })
            observer.observe(banner, { attributes: false, childList: true, characterData: false })

        })
    }, [])
    
    useEffect(() => {
        return () => {
            if (ad) {
                ad.remove()
            }
        }
    }, [ad])

    return ( 
        <div className="chat-side-ad" id='chat-side-ad' ref={bannerRef} />
    )
}

export default AboveChatAdBanner