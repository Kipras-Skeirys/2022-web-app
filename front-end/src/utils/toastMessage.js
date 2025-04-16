const ToastMessage = ({ title, description }) => (
  <div className="ToastMessage-cont">
    <span className="ToastMessage-title">{title}</span>
    <span className="ToastMessage-description">{description}</span>
  </div>
)

export default ToastMessage