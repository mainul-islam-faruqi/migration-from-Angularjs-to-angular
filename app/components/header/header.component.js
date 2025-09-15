angular.module('phonecatApp').component('appHeader', {
  template: `
    <header class="navbar navbar-default navbar-fixed-top">
      <div class="container-fluid">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="#!/phones">
            <i class="glyphicon glyphicon-phone"></i>
            PhoneCat Enterprise
          </a>
        </div>
        
        <div id="navbar" class="navbar-collapse collapse">
          <ul class="nav navbar-nav">
            <li ng-class="{active: $ctrl.isActive('/phones')}">
              <a href="#!/phones">
                <i class="glyphicon glyphicon-list"></i>
                Phone List
              </a>
            </li>
            <li ng-class="{active: $ctrl.isActive('/dashboard')}">
              <a href="#!/dashboard">
                <i class="glyphicon glyphicon-dashboard"></i>
                Dashboard
              </a>
            </li>
            <li ng-class="{active: $ctrl.isActive('/reports')}">
              <a href="#!/reports">
                <i class="glyphicon glyphicon-stats"></i>
                Reports
              </a>
            </li>
          </ul>
          
          <ul class="nav navbar-nav navbar-right">
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                <i class="glyphicon glyphicon-user"></i>
                Admin <span class="caret"></span>
              </a>
              <ul class="dropdown-menu">
                <li><a href="#!/profile">Profile</a></li>
                <li><a href="#!/settings">Settings</a></li>
                <li role="separator" class="divider"></li>
                <li><a href="#!/logout">Logout</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </header>
  `,
  controller: function($location) {
    this.isActive = function(path) {
      return $location.path().indexOf(path) === 0;
    };
  }
});
