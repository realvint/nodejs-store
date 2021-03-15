document.querySelector('#store-order').onsubmit = function (event) {
  event.preventDefault()

  let username = document.querySelector('#username').value.trim()
  let phone = document.querySelector('#phone').value.trim()
  let email = document.querySelector('#email').value.trim()
  let address = document.querySelector('#address').value.trim()

  if (!document.querySelector('#rule').checked) {
    Swal.fire({
      title : 'Внимание',
      text: 'Поставьте галочку',
      icon: 'info',
      confirmButtonText: 'Хорошечно'
    })
    return false
  }

  if (username === '' || phone === '' || email === '' || address === '') {
    Swal.fire({
      title: 'Внимание',
      text: 'Заполнены не все поля',
      icon: 'warning',
      confirmButtonText: 'ОК'
    });
    return false;
  }

  fetch('/finish-order', {
    method: 'POST',
    body: JSON.stringify({
      'username' : username,
      'phone' : phone,
      'email' : email,
      'address' : address,
      'key' : JSON.parse(localStorage.getItem('cart'))
    }),
    headers: {
      'Accept' : 'application/json',
      'Content-Type': 'application/json'
    }
  })
    .then(function (response){
      return response.text()
    })
    .then(function (body){
      if (body === '1') {
        Swal.fire({
          title: 'Success',
          text: 'Success',
          icon: 'info',
          confirmButtonText: 'Ok'
        })
      }
      else {
        Swal.fire({
          title: 'Почта не работает',
          text: 'Повторите запрос позже',
          icon: 'error',
          confirmButtonText: 'Херово'
        })
      }
    })
}