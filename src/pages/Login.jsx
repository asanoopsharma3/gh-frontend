import Logo from '../assets/logo.png'
import './login.css'

function Login () {
  return (
    <div className='login_page'>
      <div className='login-box'>
        <center>
          <img
            src={Logo}
            alt=''
            className='img-fluid'
            style={{ maxWidth: '140px' }}
          />
        </center>

        <form action=''>
          <div className='data-form-login'>
            <div className='mb-3'>
              <label style={{ color: 'white' }} className='form-label fw-bold'>
                Email
              </label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <i className='fa fa-user'></i>
                </span>
                <input
                  type='email'
                  className='form-control'
                  name='email'
                  placeholder='Please enter your email'
                />
              </div>
            </div>

            <div className='mb-3'>
              <label style={{ color: 'white' }} className='form-label fw-bold'>
                Password
              </label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <i className='fa fa-lock'></i>
                </span>
                <input
                  type='password'
                  className='form-control'
                  name='password'
                  placeholder='Please enter your password'
                />
              </div>
            </div>
          </div>

          <div className='form-check mb-3'>
            <input type='checkbox' className='form-check-input' id='remember' />
            <label
              style={{ color: 'white' }}
              className='form-check-label'
              htmlFor='remember'
            >
              Remember
            </label>
          </div>

          <button
            style={{
              fontSize: '1rem',
              backgroundColor: '#500097',
              border: '2px solid #645F8D',
              borderRadius: '6px',
              cursor: 'pointer',
              height: '50px',
              color: '#fff'
            }}
            type='submit'
            className='btn btn-success w-100 mt-3'
          >
            Sign In
          </button>
        </form>

        <br />
        <a style={{ color: '#fff' }} href='/register' className='link'>
          ← Go To User Register
        </a>
      </div>
    </div>
  )
}

export default Login
