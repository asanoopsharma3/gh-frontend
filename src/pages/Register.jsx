import Logo from '../assets/logo.png'
import './login.css'
function Register () {
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
              <label style={{color: 'white'}} className='form-label fw-bold'>
                Name
              </label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <i className='fa fa-user'></i>
                </span>
                <input
                  type='text'
                  className='form-control '
                  name='name'
                  placeholder='Please enter your name'
                  style={{ border: '1px solid white' }}
                />
              </div>
            </div>
            <div className='mb-3'>
              <label style={{color: 'white'}} className='form-label fw-bold'>
                Email
              </label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <i className='fa fa-envelope'></i>
                </span>
                <input
                  type='email'
                  className='form-control'
                  name='email'
                  placeholder='Please enter your email'
                  style={{ border: '1px solid white' }}
                />
              </div>
            </div>
            <div className='mb-3'>
              <label style={{color: 'white'}} className='form-label fw-bold'>
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
                  style={{ border: '1px solid white' }}
                />
              </div>
            </div>
            <div className='mb-3'>
              <label style={{color: 'white'}} className='form-label fw-bold'>
                Confirm Password
              </label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <i className='fa fa-lock'></i>
                </span>
                <input
                  type='password'
                  className='form-control'
                  name='password_confirmation'
                  placeholder='Please enter confirm password'
                  style={{ border: '1px solid white' }}
                />
              </div>
            </div>
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
            Register Now
          </button>
        </form>

        <br />
        <a style={{ color: '#fff' }} href='/login' className='link'>
          ← Go To User Login
        </a>
      </div>
    </div>
  )
}
export default Register
