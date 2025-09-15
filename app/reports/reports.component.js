angular.module('phonecatApp').component('reports', {
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <h1>
            <i class="glyphicon glyphicon-stats"></i>
            Reports
          </h1>
          <p class="lead">Analytics and reporting dashboard</p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-8">
          <div class="panel panel-default">
            <div class="panel-heading">
              <h3 class="panel-title">
                <i class="glyphicon glyphicon-bar-chart"></i>
                Sales Report
              </h3>
            </div>
            <div class="panel-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sales</th>
                      <th>Revenue</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr ng-repeat="report in $ctrl.salesReport">
                      <td>{{report.product}}</td>
                      <td>{{report.sales}}</td>
                      <td>{{report.revenue}}</td>
                      <td>
                        <span class="label" ng-class="report.growth > 0 ? 'label-success' : 'label-danger'">
                          {{report.growth > 0 ? '+' : ''}}{{report.growth}}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="panel panel-success">
            <div class="panel-heading">
              <h3 class="panel-title">
                <i class="glyphicon glyphicon-trophy"></i>
                Top Performers
              </h3>
            </div>
            <div class="panel-body">
              <div class="list-group">
                <div class="list-group-item" ng-repeat="performer in $ctrl.topPerformers">
                  <div class="row">
                    <div class="col-md-8">
                      <h5 class="list-group-item-heading">{{performer.name}}</h5>
                      <p class="list-group-item-text">{{performer.role}}</p>
                    </div>
                    <div class="col-md-4 text-right">
                      <span class="badge">{{performer.score}}</span>
                    </div>
                  </div>
                </div>
              </div>
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
              Angular MFE Component in Reports
            </h3>
            <div id="eui-embedded-container"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  controller: function() {
    this.salesReport = [
      { product: 'iPhone 15 Pro', sales: 45, revenue: '$45,000', growth: 12 },
      { product: 'Samsung Galaxy S24', sales: 38, revenue: '$38,000', growth: 8 },
      { product: 'Google Pixel 8', sales: 25, revenue: '$25,000', growth: -3 },
      { product: 'OnePlus 12', sales: 18, revenue: '$18,000', growth: 15 },
      { product: 'Xiaomi 14', sales: 22, revenue: '$22,000', growth: 5 }
    ];
    
    this.topPerformers = [
      { name: 'John Smith', role: 'Sales Manager', score: 95 },
      { name: 'Sarah Johnson', role: 'Account Executive', score: 92 },
      { name: 'Mike Davis', role: 'Sales Rep', score: 88 },
      { name: 'Lisa Wilson', role: 'Account Manager', score: 85 }
    ];
  }
});
