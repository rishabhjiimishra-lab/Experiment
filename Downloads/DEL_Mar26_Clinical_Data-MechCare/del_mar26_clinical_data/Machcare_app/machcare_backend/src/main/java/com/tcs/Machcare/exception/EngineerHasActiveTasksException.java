package com.tcs.Machcare.exception;


public class EngineerHasActiveTasksException extends RuntimeException {

    public EngineerHasActiveTasksException(String message) {
        super(message);
    }
}