package com.tcs.Machcare.repository;

import com.tcs.Machcare.entity.MaintenanceSchedule;
import com.tcs.Machcare.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {

    List<MaintenanceSchedule> findByEmpId(Long empId);

    int countByEmpIdAndStatusNot(Long empId, MaintenanceStatus status);

    boolean existsByEmpIdAndStatusIn(Long empId, Collection<MaintenanceStatus> statuses);

    List<MaintenanceSchedule> findByEmpIdAndStatusIn(Long empId, Collection<MaintenanceStatus> statuses);
}