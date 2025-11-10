angular.module('phonecatApp').component('dashboard', {
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <h1>
            <i class="glyphicon glyphicon-dashboard"></i>
            Dashboard
          </h1>
          <p class="lead">Welcome to the PhoneCat Enterprise Dashboard</p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="panel panel-primary">
            <div class="panel-heading">
              <h3 class="panel-title">
                <i class="glyphicon glyphicon-stats"></i>
                Statistics
              </h3>
            </div>
            <div class="panel-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="stat-box">
                    <h4>{{$ctrl.stats.totalPhones}}</h4>
                    <p>Total Phones</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-box">
                    <h4>{{$ctrl.stats.activeUsers}}</h4>
                    <p>Active Users</p>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="stat-box">
                    <h4>{{$ctrl.stats.orders}}</h4>
                    <p>Orders Today</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="stat-box">
                    <h4>{{$ctrl.stats.revenue}}</h4>
                    <p>Revenue (USD)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="panel panel-info">
            <div class="panel-heading">
              <h3 class="panel-title">
                <i class="glyphicon glyphicon-bell"></i>
                Recent Activity
              </h3>
            </div>
            <div class="panel-body">
              <ul class="list-group">
                <li class="list-group-item" ng-repeat="activity in $ctrl.recentActivity">
                  <i class="glyphicon glyphicon-{{activity.icon}}"></i>
                  {{activity.message}}
                  <span class="pull-right text-muted">{{activity.time}}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Angular MFE Component Embedded Here -->
      <div class="row">
        <div class="col-md-12">
          <div id="embedded-eui-component" style="margin-top: 20px; border: 2px dashed #ccc; padding: 20px;">
            <h3>
              <i class="glyphicon glyphicon-cog"></i>
              Angular MFE Component in Dashboard
            </h3>
            <div id="eui-embedded-container"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  controller: function() {
    this.stats = {
      totalPhones: 42,
      activeUsers: 156,
      orders: 23,
      revenue: '$12,450'
    };
    
    this.recentActivity = [
      { icon: 'plus', message: 'New phone added: iPhone 15 Pro', time: '2 min ago' },
      { icon: 'user', message: 'User John Doe logged in', time: '5 min ago' },
      { icon: 'shopping-cart', message: 'Order #1234 completed', time: '8 min ago' },
      { icon: 'star', message: 'Product rating updated', time: '12 min ago' },
      { icon: 'envelope', message: 'New message received', time: '15 min ago' }
    ];
  }
});

