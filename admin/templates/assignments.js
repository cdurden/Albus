<div>
  <div class="container">
      <div id="assignment-selector-container">
          <form action="">
              
              <div class="row">
              <div class="col-6">
              <select id="assignment-selector" name="selectedAssignments" ng-model="selectedAssignments" multiple>
                  <option ng-repeat="assignment in assignments" value="{{assignment.source}}">{{assignment.data.title}}</option>
              </select>
              </div>
              <div class="col-6">
                <div id="assignment-graph" style="text-align: center;"></div>
              </div>
              </div>
          </form>
      </div>
    <form action="" id="assign-assignment-form" class="form-container">
      <textarea style="width: 100%;" placeholder="Type instructions for assignment..." id="m" ng-model="assignment_json" autocomplete="off" />
    <button type="submit" class="submit">Assign</button>
    </form>
  </div>
</div>
