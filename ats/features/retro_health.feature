Feature: Service Health

  Scenario: Health endpoint reports dependency status
    When I request service health
    Then the response status should be 200
    And the health check should report all dependencies as healthy
