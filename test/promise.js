/**
 * Created by Kane on 15/8/2.
 */

new Promise(function (resolve, reject) {
  resolve(0)
})
  .then(function (v) {
    console.log('1');
    return Promise.reject('1');
  })
  .then(function () {
    console.log('2');
    return Promise.reject(2)
  })
  .then(function () {
    console.log('3');
    return Promise.resolve(1);
  })
  .catch(function () {
    console.log('catch', arguments);
  })