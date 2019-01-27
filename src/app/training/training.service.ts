import { Subject, Subscription } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { Injectable } from "@angular/core";
import { map, take } from "rxjs/operators";

import { Exercise } from "./exercise.model";
import { UIService } from "../shared/ui.service";

import * as UI from "../shared/ui.actions";
import * as fromTraining from "./training.reducer";
import * as Training from "./training.actions";
import { Store } from '@ngrx/store';

@Injectable()
export class TrainingService {
    // exerciseChanged = new Subject<Exercise>();
    // exercisesChanged = new Subject<Exercise[]>();
    // finishedExercisesChanged = new Subject<Exercise[]>();
    // private availableExercises: Exercise[] = [];
    // private runningExercise: Exercise;
    private fsSubs: Subscription[] = [];

    constructor(
        private db: AngularFirestore,
        private uiService: UIService,
        private store: Store<fromTraining.State>) { }

    fetchAvailableExercises() {
        this.store.dispatch(new UI.StartLoading());
        this.fsSubs.push(this.db
            .collection('availableExercises')
            .snapshotChanges()
            .pipe(
                map(docArray => {
                    // throw (new Error())
                    return docArray.map((doc: any) => {
                        return {
                            id: doc.payload.doc.id,
                            name: doc.payload.doc.data().name,
                            duration: doc.payload.doc.data().duration,
                            calories: doc.payload.doc.data().calories
                        };
                    });
                })
            )
            .subscribe((exercises: Exercise[]) => {
                this.store.dispatch(new UI.StopLoading());
                this.store.dispatch(new Training.SetAvailableTrainings(exercises));
                // this.availableExercises = exercises;
                // this.exercisesChanged.next([...this.availableExercises]);
            }, error => {
                // this.uiService.loadingStateChanged.next(false);
                this.store.dispatch(new UI.StopLoading());
                this.uiService.showSnackBar('Fetching Exercises failed, please try again later', null, 3000);                
            }));
    }

    startExercise(selectedId: string) {
        // this.runningExercise = this.availableExercises.find(
        //     ex => ex.id === selectedId
        // );
        // this.exerciseChanged.next({ ...this.runningExercise });
        this.store.dispatch(new Training.StartTraining(selectedId));
    }

    completeExercise() {
        this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
            this.addDataToDatabase(
                {
                    // ...this.runningExercise,
                    ...ex,
                    date: new Date(),
                    state: 'completed'
                });
            // this.runningExercise = null;
            // this.exerciseChanged.next(null);
            this.store.dispatch(new Training.StopTraining());
        });
    }

    cancelExercise(progress: number) {
        this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
            this.addDataToDatabase(
                {
                    // ...this.runningExercise,
                    ...ex,
                    duration: ex.duration * (progress / 100),
                    calories: ex.calories * (progress / 100),
                    date: new Date(),
                    state: 'cancelled'
                });
            // this.runningExercise = null;
            // this.exerciseChanged.next(null);
            this.store.dispatch(new Training.StopTraining());
        });        
    }

    // getRunningExercise() {
    //     return { ...this.runningExercise };
    // }

    fetchCompletedOrCancelledExercises() {
        this.fsSubs.push(this.db
            .collection('finishedExercises')
            .valueChanges()
            .subscribe((exercises: Exercise[]) => {
                // this.finishedExercisesChanged.next(exercises);
                this.store.dispatch(new Training.SetFinishedTrainings(exercises));
            }));
    }

    cancelSubscriptions() {
        this.fsSubs.forEach(sub => sub.unsubscribe());
    }

    private addDataToDatabase(exercise: Exercise) {
        this.db.collection('finishedExercises').add(exercise);
    }
}