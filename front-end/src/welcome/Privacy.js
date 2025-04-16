import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import PopUp from "../common/PopUp"

function ToggleOption(props) {

    let name = props.title.toLowerCase()

    return (
        <div className="toggleOption" name={name}>
            <input type="checkbox" className="toggleOption-checkbox" disabled={props.disabled} onChange={(e) => props.handleChange(e)} checked={props.form[name]}/>
            <div className="toggleOption-box" onClick={props.disabled ? null : (e) => props.handleChange(e)} />
            <div className="toggleOption-text-cont">
                <span className="toggleOption-title">{props.title}</span>
                <span className="toggleOption-description sml-regular gray">{props.children}</span>
                <a href={props.link} target="_blank" rel="noopener noreferrer" className="toggleOption-link link sml-regular">Learn more...</a>
            </div>
        </div>
    )
}


function Privacy() {

    const navigate = useNavigate()
    const location = useLocation()

    const analyticsSorage = sessionStorage.getItem('analytics_consent')
    const marketingSorage = sessionStorage.getItem('marketing_consent')

    const [ form, setForm ] = useState({
        functional: true,
        analytics: analyticsSorage ? (analyticsSorage === "true") : true,
        marketing: marketingSorage ? (marketingSorage === "true") : true
    })

    function handleChange(e) {
        let name = e.target.closest('[name]').getAttribute('name')
        setForm((prev) => {
            sessionStorage.setItem(`${name}_consent`, !prev[name])
            return { ...prev, ...{[name]: !prev[name]} }
        })
    }

    function handleClick() {
        navigate(-1)
    }

    useEffect(() => {
        document.title = "Privacy - web app"
    }, [])

    return ( 
        <PopUp isCloseHidden={true} isBackHidden={false}>
            <Helmet>
                <link rel="canonical" href={`https://demo.com${location.pathname}`} />
            </Helmet>
            <div className="Privacy">
                <div className="privacy-section">
                    <h1 className="privacy-title big-bold">Privacy.</h1>
                    <h2 className="privacy-section-description med-semibold">Performance Data</h2>
                    {/* <p className="privacy-description sml-regular gray"></p> */}
                    <ToggleOption title="Functional" link="https://legal.demo.com/data" handleChange={handleChange} form={form} disabled={true}>Functional data storage is essential for the site to function.</ToggleOption>
                    <ToggleOption title="Analytics" link="https://legal.demo.com/data" handleChange={handleChange} form={form}>Analytical data used to measure and improve our service.</ToggleOption>
                </div>
                <div className="privacy-section">
                    <h2 className="privacy-section-description med-semibold">Targeted Advertising Tracking</h2>
                    {/* <p className="privacy-description sml-regular gray"></p> */}
                    <ToggleOption title="Marketing" link="https://legal.demo.com/data" handleChange={handleChange} form={form}>Used for third-party targeted advertisements.</ToggleOption>
                </div>
                <button type="button" className='privacy-btn btn-red' onClick={handleClick}>Save</button>
            </div>
        </PopUp>
     )
}

export default Privacy