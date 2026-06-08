package com.tcs.Machcare.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

public class SuspendEmployeeRequest {

    @NotNull(message = "Employee ID is required.")
    private Long empId;

    @NotNull(message = "Suspension duration is required.")
    @Min(value = 1, message = "Suspension duration must be at least 1 day.")
    @Max(value = 365, message = "Suspension duration cannot exceed 365 days.")
    private Integer days;

    public SuspendEmployeeRequest() {}

    public Long getEmpId() {
        return empId;
    }

    public void setEmpId(Long empId) {
        this.empId = empId;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }
}