angular.module('phonecatApp').component('appFooter', {
  template: `
    <footer class="footer">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-6">
            <p class="text-muted">
              &copy; 2024 PhoneCat Enterprise. All rights reserved.
            </p>
          </div>
          <div class="col-md-6">
            <p class="text-muted text-right">
              <a href="#!/about">About</a> | 
              <a href="#!/contact">Contact</a> | 
              <a href="#!/privacy">Privacy</a> | 
              <a href="#!/terms">Terms</a>
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <p class="text-center text-muted small">
              <i class="glyphicon glyphicon-info-sign"></i>
              This application demonstrates AngularJS + Angular Microfrontend integration
            </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  controller: function() {
    // Footer controller logic if needed
  }
});

